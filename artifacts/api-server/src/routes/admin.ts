import { Router, type IRouter } from "express";
import { db, registrationsTable, newsTable, partnersTable, teamTable } from "@workspace/db";
import { eq, desc, sql } from "drizzle-orm";
import crypto from "crypto";

const router: IRouter = Router();

const ADMIN_USERNAME = process.env.ADMIN_USERNAME ?? "admin";
const JWT_SECRET = process.env.SESSION_SECRET ?? "almossah-national-secret-2024";
const TOKEN_EXPIRY_MS = 24 * 60 * 60 * 1000;

function createToken(username: string): string {
  const payload = Buffer.from(
    JSON.stringify({ username, iat: Date.now(), exp: Date.now() + TOKEN_EXPIRY_MS })
  ).toString("base64url");
  const sig = crypto.createHmac("sha256", JWT_SECRET).update(payload).digest("base64url");
  return `${payload}.${sig}`;
}

function verifyToken(token: string): { username: string } | null {
  try {
    const dot = token.lastIndexOf(".");
    if (dot === -1) return null;
    const payload = token.slice(0, dot);
    const sig = token.slice(dot + 1);
    const expectedSig = crypto.createHmac("sha256", JWT_SECRET).update(payload).digest("base64url");
    if (sig !== expectedSig) return null;
    const data = JSON.parse(Buffer.from(payload, "base64url").toString()) as { exp?: number; username?: string };
    if (!data.exp || data.exp < Date.now()) return null;
    if (!data.username) return null;
    return { username: data.username };
  } catch {
    return null;
  }
}

function hashPassword(password: string): string {
  return crypto.createHash("sha256").update(password).digest("hex");
}

async function getAdminPasswordHash(): Promise<string | null> {
  try {
    const result = await db.execute(
      sql`SELECT password_hash FROM admin_credentials WHERE username = ${ADMIN_USERNAME} LIMIT 1`
    );
    const row = result.rows[0] as { password_hash?: string } | undefined;
    return row?.password_hash ?? null;
  } catch {
    return null;
  }
}

async function setAdminPasswordHash(hash: string): Promise<void> {
  try {
    await db.execute(
      sql`INSERT INTO admin_credentials (username, password_hash, updated_at)
          VALUES (${ADMIN_USERNAME}, ${hash}, NOW())
          ON CONFLICT (username) DO UPDATE SET password_hash = ${hash}, updated_at = NOW()`
    );
  } catch {
    // non-fatal
  }
}

function isAuthenticated(req: import("express").Request): string | null {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader?.startsWith("Bearer ")) {
      const token = authHeader.slice(7);
      const verified = verifyToken(token);
      if (verified) return verified.username;
    }
    const session = req.session as Record<string, unknown> | undefined;
    if (session?.isAdmin && session?.username) {
      return session.username as string;
    }
  } catch {
    // session may not be available in serverless
  }
  return null;
}

// ─── POST /api/admin/login ─────────────────────────────────────────────────

router.post("/admin/login", async (req, res): Promise<void> => {
  try {
    const body = req.body as Record<string, unknown>;
    const username = typeof body?.username === "string" ? body.username.trim() : "";
    const password = typeof body?.password === "string" ? body.password : "";

    if (!username || !password) {
      res.status(400).json({ success: false, message: "يرجى إدخال اسم المستخدم وكلمة المرور" });
      return;
    }

    if (username !== ADMIN_USERNAME) {
      res.status(401).json({ success: false, message: "بيانات الدخول غير صحيحة" });
      return;
    }

    const envPassword = process.env.ADMIN_PASSWORD ?? "admin123";
    const providedHash = hashPassword(password);
    const storedHash = await getAdminPasswordHash();

    const matchesDb = storedHash ? providedHash === storedHash : false;
    const matchesEnv = password === envPassword;

    if (!matchesDb && !matchesEnv) {
      res.status(401).json({ success: false, message: "بيانات الدخول غير صحيحة" });
      return;
    }

    // Self-heal DB hash if stale
    if (!matchesDb && matchesEnv) {
      await setAdminPasswordHash(hashPassword(envPassword));
    }

    // Set session if available
    try {
      const session = req.session as Record<string, unknown> | undefined;
      if (session) {
        session.isAdmin = true;
        session.username = username;
      }
    } catch {
      // non-fatal in serverless
    }

    const token = createToken(username);
    res.json({ success: true, message: "تم تسجيل الدخول بنجاح", token });
  } catch (err) {
    res.status(500).json({ success: false, message: "خطأ في الخادم", detail: String(err) });
  }
});

// ─── POST /api/admin/logout ───────────────────────────────────────────────

router.post("/admin/logout", async (req, res): Promise<void> => {
  try {
    req.session.destroy(() => {});
  } catch {
    // non-fatal
  }
  res.json({ success: true, message: "تم تسجيل الخروج" });
});

// ─── POST /api/admin/change-password ──────────────────────────────────────

router.post("/admin/change-password", async (req, res): Promise<void> => {
  if (!isAuthenticated(req)) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }
  const body = req.body as Record<string, unknown>;
  const currentPassword = typeof body?.currentPassword === "string" ? body.currentPassword : "";
  const newPassword = typeof body?.newPassword === "string" ? body.newPassword : "";

  if (!currentPassword || !newPassword) {
    res.status(400).json({ success: false, message: "يرجى إدخال كلمة المرور الحالية والجديدة" });
    return;
  }
  if (newPassword.length < 6) {
    res.status(400).json({ success: false, message: "كلمة المرور الجديدة يجب أن تكون 6 أحرف على الأقل" });
    return;
  }

  const storedHash = await getAdminPasswordHash();
  const currentHash = hashPassword(currentPassword);
  const envHash = hashPassword(process.env.ADMIN_PASSWORD ?? "admin123");
  const isValid = storedHash ? currentHash === storedHash : currentHash === envHash;

  if (!isValid) {
    res.status(401).json({ success: false, message: "كلمة المرور الحالية غير صحيحة" });
    return;
  }

  await setAdminPasswordHash(hashPassword(newPassword));
  res.json({ success: true, message: "تم تغيير كلمة المرور بنجاح" });
});

// ─── GET /api/admin/me ────────────────────────────────────────────────────

router.get("/admin/me", async (req, res): Promise<void> => {
  const username = isAuthenticated(req);
  if (!username) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }
  res.json({ username, isAdmin: true });
});

// ─── GET /api/admin/dashboard ─────────────────────────────────────────────

router.get("/admin/dashboard", async (req, res): Promise<void> => {
  if (!isAuthenticated(req)) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }

  const [
    totalReg,
    pendingReg,
    approvedReg,
    rejectedReg,
    totalNews,
    totalPartners,
    totalTeam,
    recentRegistrations,
  ] = await Promise.all([
    db.select({ count: sql<number>`count(*)::int` }).from(registrationsTable),
    db.select({ count: sql<number>`count(*)::int` }).from(registrationsTable).where(eq(registrationsTable.status, "pending")),
    db.select({ count: sql<number>`count(*)::int` }).from(registrationsTable).where(eq(registrationsTable.status, "approved")),
    db.select({ count: sql<number>`count(*)::int` }).from(registrationsTable).where(eq(registrationsTable.status, "rejected")),
    db.select({ count: sql<number>`count(*)::int` }).from(newsTable),
    db.select({ count: sql<number>`count(*)::int` }).from(partnersTable),
    db.select({ count: sql<number>`count(*)::int` }).from(teamTable),
    db.select().from(registrationsTable).orderBy(desc(registrationsTable.createdAt)).limit(5),
  ]);

  res.json({
    totalRegistrations: totalReg[0]?.count ?? 0,
    pendingRegistrations: pendingReg[0]?.count ?? 0,
    approvedRegistrations: approvedReg[0]?.count ?? 0,
    rejectedRegistrations: rejectedReg[0]?.count ?? 0,
    totalNews: totalNews[0]?.count ?? 0,
    totalPartners: totalPartners[0]?.count ?? 0,
    totalTeamMembers: totalTeam[0]?.count ?? 0,
    recentRegistrations: recentRegistrations.map(r => ({ ...r, createdAt: r.createdAt.toISOString() })),
  });
});

export default router;
