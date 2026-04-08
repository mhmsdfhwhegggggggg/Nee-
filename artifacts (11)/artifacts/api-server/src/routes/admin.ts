import { Router, type IRouter } from "express";
import { db, registrationsTable, newsTable, partnersTable, teamTable } from "@workspace/db";
import { eq, desc, sql } from "drizzle-orm";
import { AdminLoginBody } from "@workspace/api-zod";
import crypto from "crypto";

const router: IRouter = Router();

const ADMIN_USERNAME = process.env.ADMIN_USERNAME ?? "admin";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "admin123";

// In-memory token store: token -> username
const adminTokens = new Map<string, string>();

// Helper to check auth from either session OR Authorization header
function isAuthenticated(req: import("express").Request): string | null {
  // Check Authorization header first (most reliable)
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.slice(7);
    const username = adminTokens.get(token);
    if (username) return username;
  }
  // Fallback: check session cookie
  const session = req.session as Record<string, unknown>;
  if (session.isAdmin && session.username) {
    return session.username as string;
  }
  return null;
}

router.post("/admin/login", async (req, res): Promise<void> => {
  const parsed = AdminLoginBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { username, password } = parsed.data;

  if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
    // Set session cookie (may or may not work depending on environment)
    (req.session as Record<string, unknown>).isAdmin = true;
    (req.session as Record<string, unknown>).username = username;
    // Also generate a token for header-based auth
    const token = crypto.randomBytes(32).toString("hex");
    adminTokens.set(token, username);
    res.json({ success: true, message: "تم تسجيل الدخول بنجاح", token });
  } else {
    res.status(401).json({ success: false, message: "بيانات الدخول غير صحيحة" });
  }
});

router.post("/admin/logout", async (req, res): Promise<void> => {
  // Remove token if present
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith("Bearer ")) {
    adminTokens.delete(authHeader.slice(7));
  }
  req.session.destroy(() => {});
  res.json({ success: true, message: "تم تسجيل الخروج" });
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
