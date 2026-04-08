import { Router, type IRouter } from "express";
import { db, statsTable } from "@workspace/db";
import { UpdateStatsBody } from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/stats", async (_req, res): Promise<void> => {
  let [stats] = await db.select().from(statsTable);
  if (!stats) {
    [stats] = await db.insert(statsTable).values({}).returning();
  }
  res.json({
    yearsExperience: stats.yearsExperience,
    programs: stats.programs,
    beneficiaries: stats.beneficiaries,
    experts: stats.experts,
    universities: stats.universities,
    partners: stats.partners,
  });
});

router.patch("/stats", async (req, res): Promise<void> => {
  const parsed = UpdateStatsBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  let [stats] = await db.select().from(statsTable);
  if (!stats) {
    [stats] = await db.insert(statsTable).values({}).returning();
  }

  const [updated] = await db
    .update(statsTable)
    .set(parsed.data)
    .returning();

  res.json({
    yearsExperience: updated.yearsExperience,
    programs: updated.programs,
    beneficiaries: updated.beneficiaries,
    experts: updated.experts,
    universities: updated.universities,
    partners: updated.partners,
  });
});

export default router;
