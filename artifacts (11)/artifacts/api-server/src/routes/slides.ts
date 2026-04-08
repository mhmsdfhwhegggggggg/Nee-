import { Router, type IRouter } from "express";
import { eq, asc } from "drizzle-orm";
import { db, slidesTable } from "@workspace/db";

const router: IRouter = Router();

router.get("/slides", async (_req, res): Promise<void> => {
  const items = await db.select().from(slidesTable).where(eq(slidesTable.active, true)).orderBy(asc(slidesTable.order));
  res.json(items.map(s => ({ ...s, subtitle: s.subtitle ?? null })));
});

router.get("/slides/all", async (_req, res): Promise<void> => {
  const items = await db.select().from(slidesTable).orderBy(asc(slidesTable.order));
  res.json(items.map(s => ({ ...s, subtitle: s.subtitle ?? null })));
});

router.post("/slides", async (req, res): Promise<void> => {
  const { title, subtitle, url, type, active, order } = req.body;
  if (!title || !url || !type) {
    res.status(400).json({ error: "title, url, and type are required" });
    return;
  }
  const [item] = await db.insert(slidesTable).values({
    title,
    subtitle: subtitle ?? null,
    url,
    type,
    active: active ?? true,
    order: order ?? 0,
  }).returning();
  res.status(201).json({ ...item, subtitle: item.subtitle ?? null });
});

router.patch("/slides/:id", async (req, res): Promise<void> => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  const { title, subtitle, url, type, active, order } = req.body;
  const updates: Record<string, unknown> = {};
  if (title !== undefined) updates.title = title;
  if (subtitle !== undefined) updates.subtitle = subtitle;
  if (url !== undefined) updates.url = url;
  if (type !== undefined) updates.type = type;
  if (active !== undefined) updates.active = active;
  if (order !== undefined) updates.order = order;

  const [item] = await db.update(slidesTable).set(updates).where(eq(slidesTable.id, id)).returning();
  if (!item) {
    res.status(404).json({ error: "Slide not found" });
    return;
  }
  res.json({ ...item, subtitle: item.subtitle ?? null });
});

router.delete("/slides/:id", async (req, res): Promise<void> => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  const [item] = await db.delete(slidesTable).where(eq(slidesTable.id, id)).returning();
  if (!item) {
    res.status(404).json({ error: "Slide not found" });
    return;
  }
  res.sendStatus(204);
});

export default router;
