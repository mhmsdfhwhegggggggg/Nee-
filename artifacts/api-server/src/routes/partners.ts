import { Router, type IRouter } from "express";
import { eq, asc } from "drizzle-orm";
import { db, partnersTable } from "@workspace/db";
import {
  CreatePartnerBody,
  UpdatePartnerBody,
  UpdatePartnerParams,
  DeletePartnerParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/partners", async (_req, res): Promise<void> => {
  const items = await db.select().from(partnersTable).orderBy(asc(partnersTable.order));
  res.json(items.map(p => ({ ...p, website: p.website ?? null })));
});

router.post("/partners", async (req, res): Promise<void> => {
  const parsed = CreatePartnerBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [item] = await db.insert(partnersTable).values({
    ...parsed.data,
    order: parsed.data.order ?? 0,
  }).returning();
  res.status(201).json({ ...item, website: item.website ?? null });
});

router.patch("/partners/:id", async (req, res): Promise<void> => {
  const params = UpdatePartnerParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdatePartnerBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [item] = await db
    .update(partnersTable)
    .set(parsed.data)
    .where(eq(partnersTable.id, params.data.id))
    .returning();

  if (!item) {
    res.status(404).json({ error: "Partner not found" });
    return;
  }
  res.json({ ...item, website: item.website ?? null });
});

router.delete("/partners/:id", async (req, res): Promise<void> => {
  const params = DeletePartnerParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [item] = await db.delete(partnersTable).where(eq(partnersTable.id, params.data.id)).returning();
  if (!item) {
    res.status(404).json({ error: "Partner not found" });
    return;
  }
  res.sendStatus(204);
});

export default router;
