import { Router, type IRouter } from "express";
  import { eq, desc, sql } from "drizzle-orm";
  import { db, registrationsTable } from "@workspace/db";
  import {
    CreateRegistrationBody,
    UpdateRegistrationBody,
    UpdateRegistrationParams,
    GetRegistrationParams,
    DeleteRegistrationParams,
  } from "@workspace/api-zod";

  const router: IRouter = Router();

  const KNOWN_FIELDS = new Set([
    "fullName", "email", "phone", "city", "programType", "message",
    "certificateImageUrl", "gpa", "department",
    "universityChoice1", "universityChoice2", "universityChoice3",
    "specializationChoice1", "specializationChoice2", "specializationChoice3",
  ]);

  // Fields that are nullable in the DB — empty strings should become NULL
  const NULLABLE_FIELDS = new Set([
    "gpa", "department", "message", "certificateImageUrl",
    "universityChoice1", "universityChoice2", "universityChoice3",
    "specializationChoice1", "specializationChoice2", "specializationChoice3",
  ]);

  router.get("/registrations", async (req, res): Promise<void> => {
    const { status, page = "1", limit = "20" } = req.query as Record<string, string>;
    const pageNum = parseInt(page, 10) || 1;
    const limitNum = Math.min(parseInt(limit, 10) || 20, 100);
    const offset = (pageNum - 1) * limitNum;

    const [items, countResult] = await Promise.all([
      status
        ? db.select().from(registrationsTable).where(eq(registrationsTable.status, status)).orderBy(desc(registrationsTable.createdAt)).limit(limitNum).offset(offset)
        : db.select().from(registrationsTable).orderBy(desc(registrationsTable.createdAt)).limit(limitNum).offset(offset),
      status
        ? db.select({ count: sql<number>`count(*)::int` }).from(registrationsTable).where(eq(registrationsTable.status, status))
        : db.select({ count: sql<number>`count(*)::int` }).from(registrationsTable),
    ]);

    const total = countResult[0]?.count ?? 0;

    res.json({
      items: items.map(r => ({ ...r, createdAt: r.createdAt.toISOString() })),
      total,
      page: pageNum,
      limit: limitNum,
    });
  });

  router.post("/registrations", async (req, res): Promise<void> => {
    // Apply defaults for fields that may not be present in the dynamic form config
    const body = {
      email: "",
      programType: "منح دراسية",
      ...req.body,
    };

    const parsed = CreateRegistrationBody.safeParse(body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.message });
      return;
    }

    const extraData: Record<string, string> = {};
    for (const [key, value] of Object.entries(req.body)) {
      if (!KNOWN_FIELDS.has(key) && typeof value === "string" && value.trim()) {
        extraData[key] = value.trim();
      }
    }

    // For nullable fields only: convert empty strings to undefined so DB stores NULL
    const sanitized = Object.fromEntries(
      Object.entries(parsed.data).map(([k, v]) => [
        k,
        NULLABLE_FIELDS.has(k) && typeof v === "string" && v.trim() === "" ? undefined : v,
      ])
    );

    const insertValues = {
      ...sanitized,
      ...(Object.keys(extraData).length > 0 ? { extraData } : {}),
    };

    const [reg] = await db.insert(registrationsTable).values(insertValues as any).returning();
    res.status(201).json({ ...reg, createdAt: reg.createdAt.toISOString() });
  });

  router.get("/registrations/:id", async (req, res): Promise<void> => {
    const params = GetRegistrationParams.safeParse(req.params);
    if (!params.success) {
      res.status(400).json({ error: params.error.message });
      return;
    }

    const [reg] = await db.select().from(registrationsTable).where(eq(registrationsTable.id, params.data.id));
    if (!reg) {
      res.status(404).json({ error: "Registration not found" });
      return;
    }
    res.json({ ...reg, createdAt: reg.createdAt.toISOString() });
  });

  router.patch("/registrations/:id", async (req, res): Promise<void> => {
    const params = UpdateRegistrationParams.safeParse(req.params);
    if (!params.success) {
      res.status(400).json({ error: params.error.message });
      return;
    }

    const parsed = UpdateRegistrationBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.message });
      return;
    }

    const [reg] = await db
      .update(registrationsTable)
      .set(parsed.data)
      .where(eq(registrationsTable.id, params.data.id))
      .returning();

    if (!reg) {
      res.status(404).json({ error: "Registration not found" });
      return;
    }
    res.json({ ...reg, createdAt: reg.createdAt.toISOString() });
  });

  router.delete("/registrations/:id", async (req, res): Promise<void> => {
    const params = DeleteRegistrationParams.safeParse(req.params);
    if (!params.success) {
      res.status(400).json({ error: params.error.message });
      return;
    }

    const [reg] = await db
      .delete(registrationsTable)
      .where(eq(registrationsTable.id, params.data.id))
      .returning();

    if (!reg) {
      res.status(404).json({ error: "Registration not found" });
      return;
    }
    res.sendStatus(204);
  });

  export default router;
  