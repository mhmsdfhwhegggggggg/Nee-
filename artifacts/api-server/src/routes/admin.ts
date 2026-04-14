import { Router, type IRouter } from "express";
import { db, registrationsTable, newsTable, partnersTable, teamTable } from "@workspace/db";
import { eq, desc, sql } from "drizzle-orm";
import { AdminLoginBody } from "@workspace/api-zod";
import crypto from "crypto";
import { pool } from "@workspace/db";

const router: IRouter = Router();

const ADMIN_USERNAME = process.env.ADMIN_USERNAME ?? "admin";
const JWT_SECRET = process.env.SESSION_SECRET ?? "almossah-national-secret-2024";
const TOKEN_EXPIRY_MS = 24 * 60 * 60 * 1000; // 24 hours

// --- Stateless token helpers (HMAC-signed, no server-side storage) ---

function createToken(username: string): string {
  const payload = Buffer.from(JSON.stringify({ username, iat: Date.now(), exp: Date.now() + TOKEN_EXPIRY_MS })).toString("base64url");
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
    const data = JSON.parse(Buffer.from(payload, "base64url").toString());
    if (!data.exp || data.exp < Date.now()) return null;
    return { username: data.username };
  } catch {
    return null;
  }
}

function hashPassword(password: string): string {
  return crypto.createHash("sha256").update(password).digest("hex");
}

// --- DB helpers ---

async function getAdminPasswordHash(): Promise<string | null> {
  const result = await pool.query<{ password_hash: string }>(
    "SELECT password_hash FROM admin_credentials WHERE username = $1 LIMIT 1",
    [ADMIN_USERNAME]
  );
  return result.rows[0]?.password_hash ?? null;
}

async function setAdminPasswordHash(hash: string): Promise<void> {
  await pool.query(
    `INSERT INTO admin_credentials (username, password_hash, updated_at)
     VALUES ($1, $2, NOW())
     ON CONFLICT (username) DO UPDATE SET password_hash = $2, updated_at = NOW()`,
    [ADMIN_USERNAME, hash]
  );
}

// --- Auth helper ---

function isAuthenticated(req: import("express").Request): string | null {
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.slice(7);
    const verified = verifyToken(token);
    if (verified) return verified.username;
  }
  // Fallback: session cookie
  const session = req.session as Record<string, unknown>;
  if (session.isAdmin && session.username) {
    return session.username as string;
  }
  return null;
}

// --- Routes ---

router.post("/admin/login", async (req, res): Promise<void> => {
  const parsed = AdminLoginBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { username, password } = parsed.data;

  if (username !== ADMIN_USERNAME) {
    res.status(401).json({ success: false, message: "بيانات الدخول غير صحيحة" });
    return;
  }

  // Get password hash from DB
  let storedHash = await getAdminPasswordHash();

  // If no DB record, fall back to env var check and create DB record
  if (!storedHash) {
    const envPassword = process.env.ADMIN_PASSWORD ?? "admin123";
    if (password !== envPassword) {
      res.status(401).json({ success: false, message: "بيانات الدخول غير صحيحة" });
      return;
    }
    // Store the hash in DB for future use
    storedHash = hashPassword(envPassword);
    await setAdminPasswordHash(storedHash);
  } else {
    if (hashPassword(password) !== storedHash) {
      res.status(401).json({ success: false, message: "بيانات الدخول غير صحيحة" });
      return;
    }
  }

  // Set session (may not work in serverless but kept for compatibility)
  (req.session as Record<string, unknown>).isAdmin = true;
  (req.session as Record<string, unknown>).username = username;

  // Generate stateless signed token
  const token = createToken(username);
  res.json({ success: true, message: "تم تسجيل الدخول بنجاح", token });
});

router.post("/admin/logout", async (req, res): Promise<void> => {
  req.session.destroy(() => {});
  res.json({ success: true, message: "تم تسجيل الخروج" });
});

router.post("/admin/change-password", async (req, res): Promise<void> => {
  if (!isAuthenticated(req)) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }
  const { currentPassword, newPassword } = req.body;
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

  // Check against DB or env var fallback
  const envHash = hashPassword(process.env.ADMIN_PASSWORD ?? "admin123");
  const isValid = storedHash ? (currentHash === storedHash) : (currentHash === envHash);

  if (!isValid) {
    res.status(401).json({ success: false, message: "كلمة المرور الحالية غير صحيحة" });
    return;
  }

  await setAdminPasswordHash(hashPassword(newPassword));
  res.json({ success: true, message: "تم تغيير كلمة المرور بنجاح" });
});

router.get("/admin/me", async (req, res): Promise<void> => {
  const username = isAuthenticated(req);
  if (!username) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }
  res.json({ username, isAdmin: true });
});

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
