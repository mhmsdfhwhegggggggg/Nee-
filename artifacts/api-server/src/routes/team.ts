import { Router, type IRouter } from "express";
import { eq, asc } from "drizzle-orm";
import { db, teamTable } from "@workspace/db";
import {
  CreateTeamMemberBody,
  UpdateTeamMemberBody,
  UpdateTeamMemberParams,
  DeleteTeamMemberParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/team", async (_req, res): Promise<void> => {
  const items = await db.select().from(teamTable).orderBy(asc(teamTable.order));
  res.json(items.map(t => ({ ...t, bio: t.bio ?? null, imageUrl: t.imageUrl ?? null })));
});

router.post("/team", async (req, res): Promise<void> => {
  const parsed = CreateTeamMemberBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [item] = await db.insert(teamTable).values({
    ...parsed.data,
    order: parsed.data.order ?? 0,
  }).returning();
  res.status(201).json({ ...item, bio: item.bio ?? null, imageUrl: item.imageUrl ?? null });
});

router.patch("/team/:id", async (req, res): Promise<void> => {
  const params = UpdateTeamMemberParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdateTeamMemberBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [item] = await db
    .update(teamTable)
    .set(parsed.data)
    .where(eq(teamTable.id, params.data.id))
    .returning();

  if (!item) {
    res.status(404).json({ error: "Team member not found" });
    return;
  }
  res.json({ ...item, bio: item.bio ?? null, imageUrl: item.imageUrl ?? null });
});

router.delete("/team/:id", async (req, res): Promise<void> => {
  const params = DeleteTeamMemberParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [item] = await db.delete(teamTable).where(eq(teamTable.id, params.data.id)).returning();
  if (!item) {
    res.status(404).json({ error: "Team member not found" });
    return;
  }
  res.sendStatus(204);
});

export default router;
