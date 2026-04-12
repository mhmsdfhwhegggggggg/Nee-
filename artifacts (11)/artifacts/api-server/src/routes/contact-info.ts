import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, contactInfoTable } from "@workspace/db";

const router: IRouter = Router();

router.get("/contact-info", async (req, res): Promise<void> => {
  const rows = await db.select().from(contactInfoTable);
  if (rows.length === 0) {
    const [inserted] = await db.insert(contactInfoTable).values({}).returning();
    res.json(inserted);
    return;
  }
  res.json(rows[0]);
});

router.patch("/contact-info", async (req, res): Promise<void> => {
  const rows = await db.select().from(contactInfoTable);
  let id: number;
  if (rows.length === 0) {
    const [inserted] = await db.insert(contactInfoTable).values({}).returning();
    id = inserted.id;
  } else {
    id = rows[0].id;
  }

  const allowedFields = [
    "phone1", "phone2", "email1", "email2", "address", "addressDetail",
    "workHours", "workHoursOff", "facebookUrl", "twitterUrl", "instagramUrl",
    "youtubeUrl", "linkedinUrl", "whatsappNumber", "mapEmbedUrl"
  ];

  const updateData: Record<string, string> = {};
  for (const field of allowedFields) {
    if (req.body[field] !== undefined) {
      updateData[field] = req.body[field];
    }
  }

  if (Object.keys(updateData).length === 0) {
    const current = await db.select().from(contactInfoTable).where(eq(contactInfoTable.id, id));
    res.json(current[0]);
    return;
  }

  const [updated] = await db
    .update(contactInfoTable)
    .set(updateData)
    .where(eq(contactInfoTable.id, id))
    .returning();

  res.json(updated);
});

export default router;
