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
    const parsed = CreateRegistrationBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.message });
      return;
    }

    const [reg] = await db.insert(registrationsTable).values(parsed.data).returning();
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
  