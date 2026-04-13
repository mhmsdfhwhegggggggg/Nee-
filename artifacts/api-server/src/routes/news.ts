import { Router, type IRouter } from "express";
import { eq, desc, sql } from "drizzle-orm";
import { db, newsTable } from "@workspace/db";
import {
  CreateNewsBody,
  UpdateNewsBody,
  UpdateNewsParams,
  GetNewsParams,
  DeleteNewsParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/news", async (req, res): Promise<void> => {
  const { type, page = "1", limit = "10" } = req.query as Record<string, string>;
  const pageNum = parseInt(page, 10) || 1;
  const limitNum = Math.min(parseInt(limit, 10) || 10, 100);
  const offset = (pageNum - 1) * limitNum;

  const baseQuery = db.select().from(newsTable);
  const countQuery = db.select({ count: sql<number>`count(*)::int` }).from(newsTable);

  if (type) {
    baseQuery.where(eq(newsTable.type, type));
    countQuery.where(eq(newsTable.type, type));
  }

  const [items, countResult] = await Promise.all([
    baseQuery.orderBy(desc(newsTable.createdAt)).limit(limitNum).offset(offset),
    countQuery,
  ]);

  const total = countResult[0]?.count ?? 0;

  res.json({
    items: items.map(n => ({ ...n, imageUrl: n.imageUrl ?? null, createdAt: n.createdAt.toISOString() })),
    total,
    page: pageNum,
    limit: limitNum,
  });
});

router.post("/news", async (req, res): Promise<void> => {
  const parsed = CreateNewsBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [item] = await db.insert(newsTable).values({
    ...parsed.data,
    published: parsed.data.published ?? true,
  }).returning();
  res.status(201).json({ ...item, imageUrl: item.imageUrl ?? null, createdAt: item.createdAt.toISOString() });
});

router.get("/news/:id", async (req, res): Promise<void> => {
  const params = GetNewsParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [item] = await db.select().from(newsTable).where(eq(newsTable.id, params.data.id));
  if (!item) {
    res.status(404).json({ error: "News not found" });
    return;
  }
  res.json({ ...item, imageUrl: item.imageUrl ?? null, createdAt: item.createdAt.toISOString() });
});

router.patch("/news/:id", async (req, res): Promise<void> => {
  const params = UpdateNewsParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdateNewsBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [item] = await db
    .update(newsTable)
    .set(parsed.data)
    .where(eq(newsTable.id, params.data.id))
    .returning();

  if (!item) {
    res.status(404).json({ error: "News not found" });
    return;
  }
  res.json({ ...item, imageUrl: item.imageUrl ?? null, createdAt: item.createdAt.toISOString() });
});

router.delete("/news/:id", async (req, res): Promise<void> => {
  const params = DeleteNewsParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [item] = await db.delete(newsTable).where(eq(newsTable.id, params.data.id)).returning();
  if (!item) {
    res.status(404).json({ error: "News not found" });
    return;
  }
  res.sendStatus(204);
});

export default router;
