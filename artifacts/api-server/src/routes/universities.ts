import { Router, type IRouter } from "express";
import { eq, asc } from "drizzle-orm";
import { db, universitiesTable, universitySpecializationsTable } from "@workspace/db";

const router: IRouter = Router();

async function listUniversitiesWithSpecs(onlyEnabled: boolean) {
  const universities = await db
    .select()
    .from(universitiesTable)
    .orderBy(asc(universitiesTable.order), asc(universitiesTable.id));

  const filteredUnis = onlyEnabled ? universities.filter((u) => u.enabled) : universities;

  const specs = await db
    .select()
    .from(universitySpecializationsTable)
    .orderBy(asc(universitySpecializationsTable.order), asc(universitySpecializationsTable.id));

  return filteredUnis.map((u) => ({
    ...u,
    createdAt: u.createdAt.toISOString(),
    updatedAt: u.updatedAt.toISOString(),
    specializations: specs
      .filter((s) => s.universityId === u.id && (onlyEnabled ? s.enabled : true))
      .map((s) => ({
        ...s,
        createdAt: s.createdAt.toISOString(),
        updatedAt: s.updatedAt.toISOString(),
      })),
  }));
}

router.get("/universities", async (_req, res): Promise<void> => {
  const data = await listUniversitiesWithSpecs(true);
  res.json(data);
});

router.get("/admin/universities", async (_req, res): Promise<void> => {
  const data = await listUniversitiesWithSpecs(false);
  res.json(data);
});

router.post("/admin/universities", async (req, res): Promise<void> => {
  const { name, description, logoUrl, order, enabled } = req.body;
  if (!name) {
    res.status(400).json({ error: "name is required" });
    return;
  }
  const [u] = await db
    .insert(universitiesTable)
    .values({
      name,
      description: description || null,
      logoUrl: logoUrl || null,
      order: order || 0,
      enabled: enabled !== false,
    })
    .returning();
  res.status(201).json({
    ...u,
    createdAt: u.createdAt.toISOString(),
    updatedAt: u.updatedAt.toISOString(),
    specializations: [],
  });
});

router.patch("/admin/universities/:id", async (req, res): Promise<void> => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  const updateData: Record<string, unknown> = {};
  const { name, description, logoUrl, order, enabled } = req.body;
  if (name !== undefined) updateData.name = name;
  if (description !== undefined) updateData.description = description;
  if (logoUrl !== undefined) updateData.logoUrl = logoUrl;
  if (order !== undefined) updateData.order = order;
  if (enabled !== undefined) updateData.enabled = enabled;

  const [u] = await db
    .update(universitiesTable)
    .set(updateData)
    .where(eq(universitiesTable.id, id))
    .returning();
  if (!u) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  res.json({
    ...u,
    createdAt: u.createdAt.toISOString(),
    updatedAt: u.updatedAt.toISOString(),
  });
});

router.delete("/admin/universities/:id", async (req, res): Promise<void> => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  const [u] = await db
    .delete(universitiesTable)
    .where(eq(universitiesTable.id, id))
    .returning();
  if (!u) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  res.sendStatus(204);
});

router.post("/admin/universities/:id/specializations", async (req, res): Promise<void> => {
  const universityId = parseInt(req.params.id, 10);
  if (isNaN(universityId)) {
    res.status(400).json({ error: "Invalid university id" });
    return;
  }
  const { name, category, minGpa, track, durationYears, annualFees, notes, order, enabled } = req.body;
  if (!name) {
    res.status(400).json({ error: "name is required" });
    return;
  }
  const [s] = await db
    .insert(universitySpecializationsTable)
    .values({
      universityId,
      name,
      category: category || null,
      minGpa: typeof minGpa === "number" ? minGpa : parseFloat(minGpa) || 0,
      track: track || "both",
      durationYears: durationYears ? parseInt(String(durationYears), 10) : null,
      annualFees: annualFees || null,
      notes: notes || null,
      order: order || 0,
      enabled: enabled !== false,
    })
    .returning();
  res.status(201).json({
    ...s,
    createdAt: s.createdAt.toISOString(),
    updatedAt: s.updatedAt.toISOString(),
  });
});

router.patch("/admin/specializations/:id", async (req, res): Promise<void> => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  const updateData: Record<string, unknown> = {};
  const { name, category, minGpa, track, durationYears, annualFees, notes, order, enabled } = req.body;
  if (name !== undefined) updateData.name = name;
  if (category !== undefined) updateData.category = category;
  if (minGpa !== undefined) updateData.minGpa = typeof minGpa === "number" ? minGpa : parseFloat(minGpa) || 0;
  if (track !== undefined) updateData.track = track;
  if (durationYears !== undefined) updateData.durationYears = durationYears ? parseInt(String(durationYears), 10) : null;
  if (annualFees !== undefined) updateData.annualFees = annualFees;
  if (notes !== undefined) updateData.notes = notes;
  if (order !== undefined) updateData.order = order;
  if (enabled !== undefined) updateData.enabled = enabled;

  const [s] = await db
    .update(universitySpecializationsTable)
    .set(updateData)
    .where(eq(universitySpecializationsTable.id, id))
    .returning();
  if (!s) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  res.json({
    ...s,
    createdAt: s.createdAt.toISOString(),
    updatedAt: s.updatedAt.toISOString(),
  });
});

router.delete("/admin/specializations/:id", async (req, res): Promise<void> => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  const [s] = await db
    .delete(universitySpecializationsTable)
    .where(eq(universitySpecializationsTable.id, id))
    .returning();
  if (!s) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  res.sendStatus(204);
});

router.post("/admin/universities/seed-defaults", async (_req, res): Promise<void> => {
  const existing = await db.select().from(universitiesTable);
  if (existing.length > 0) {
    res.json({ message: "Universities already exist", count: existing.length });
    return;
  }

  const azal = {
    name: "جامعة أزال للتنمية البشرية",
    description: "Azal University for Human Development",
    order: 1,
    specs: [
      { category: "العلوم الطبية", name: "الصيدلة", minGpa: 70, track: "scientific", durationYears: 5, annualFees: "$2,143" },
      { category: "العلوم الطبية", name: "المختبرات", minGpa: 65, track: "both", durationYears: 4, annualFees: "$1,786" },
      { category: "العلوم الطبية", name: "العلاج الطبيعي", minGpa: 65, track: "both", durationYears: 4, annualFees: "$1,571" },
      { category: "العلوم الطبية", name: "التمريض التخصصي", minGpa: 65, track: "both", durationYears: 4, annualFees: "$1,429" },
      { category: "العلوم الطبية", name: "تكنولوجيا التخدير", minGpa: 65, track: "both", durationYears: 4, annualFees: "$3,143" },
      { category: "العلوم الطبية", name: "تكنولوجيا الأشعة", minGpa: 63, track: "both", durationYears: 4, annualFees: "$2,714" },
      { category: "العلوم الطبية", name: "القبالة", minGpa: 63, track: "scientific", durationYears: 4, annualFees: "$1,714" },
      { category: "العلوم الطبية", name: "التغذية العلاجية والحميات", minGpa: 65, track: "both", durationYears: 4, annualFees: "$1,571" },
      { category: "الهندسة وتكنولوجيا المعلومات", name: "تقنية المعلومات IT", minGpa: 55, track: "scientific", durationYears: 4, annualFees: "$1,714" },
      { category: "الهندسة وتكنولوجيا المعلومات", name: "الهندسة المدنية", minGpa: 65, track: "scientific", durationYears: 4, annualFees: "$1,571" },
      { category: "الهندسة وتكنولوجيا المعلومات", name: "الهندسة المعمارية", minGpa: 65, track: "scientific", durationYears: 5, annualFees: "$1,714" },
      { category: "الهندسة وتكنولوجيا المعلومات", name: "الجرافيكس والمالتيمديا", minGpa: 60, track: "scientific", durationYears: 4, annualFees: "$1,886" },
      { category: "الهندسة وتكنولوجيا المعلومات", name: "الأمن السيبراني", minGpa: 60, track: "scientific", durationYears: 4, annualFees: "$1,714" },
      { category: "الهندسة وتكنولوجيا المعلومات", name: "هندسة شبكات والاتصالات", minGpa: 65, track: "scientific", durationYears: 4, annualFees: "$1,429" },
      { category: "العلوم الإدارية والإنسانية", name: "إدارة أعمال", minGpa: 50, track: "both", durationYears: 4, annualFees: "$800" },
      { category: "العلوم الإدارية والإنسانية", name: "المحاسبة", minGpa: 50, track: "both", durationYears: 4, annualFees: "$957" },
      { category: "العلوم الإدارية والإنسانية", name: "اللغة الإنجليزية والترجمة", minGpa: 50, track: "both", durationYears: 4, annualFees: "$714" },
      { category: "العلوم الإدارية والإنسانية", name: "العلوم المالية والمصرفية", minGpa: 50, track: "both", durationYears: 4, annualFees: "$800" },
      { category: "العلوم الإدارية والإنسانية", name: "نظم المعلومات الإدارية", minGpa: 50, track: "both", durationYears: 4, annualFees: "$800" },
      { category: "العلوم الإدارية والإنسانية", name: "الإدارة الصحية", minGpa: 50, track: "both", durationYears: 4, annualFees: "$957" },
      { category: "العلوم الإدارية والإنسانية", name: "إدارة الأعمال الدولية", minGpa: 50, track: "both", durationYears: 4, annualFees: "$957" },
      { category: "تربية أزال", name: "علوم حاسوب للمعلم", minGpa: 48, track: "both", durationYears: 4, annualFees: "$1,000" },
      { category: "تربية أزال", name: "تربية ذوي الاحتياجات الخاصة", minGpa: 50, track: "both", durationYears: 4, annualFees: "$1,000" },
      { category: "تربية أزال", name: "الإرشاد النفسي والتربوي", minGpa: 55, track: "both", durationYears: 4, annualFees: "$1,000" },
    ],
  };

  const yemenia = {
    name: "الجامعة اليمنية",
    description: "AlYemenia University",
    order: 2,
    specs: [
      { name: "الطب البشري", minGpa: 78, track: "scientific", annualFees: "$7,000" },
      { name: "طب الأسنان", minGpa: 75, track: "scientific", annualFees: "$4,900" },
      { name: "الصيدلة", minGpa: 70, track: "scientific", annualFees: "$2,200" },
      { name: "الطب المخبري", minGpa: 65, track: "scientific", annualFees: "$1,800" },
      { name: "التغذية العلاجية", minGpa: 65, track: "scientific", annualFees: "$2,100" },
      { name: "التمريض العالي", minGpa: 65, track: "scientific", annualFees: "$1,750" },
      { name: "القبالة", minGpa: 65, track: "scientific", annualFees: "$1,750" },
      { name: "تكنولوجيا المعلومات IT", minGpa: 55, track: "scientific", annualFees: "$1,700" },
      { name: "الهندسة المعمارية", minGpa: 65, track: "scientific", annualFees: "$1,900" },
      { name: "التصميم الجرافيكي والملتيميديا", minGpa: 60, track: "both", annualFees: "$1,700" },
      { name: "الأمن السيبراني والشبكات", minGpa: 55, track: "scientific", annualFees: "$1,900" },
      { name: "الهندسة الطبية الحيوية", minGpa: 60, track: "scientific", annualFees: "$2,300" },
      { name: "التصميم الداخلي", minGpa: 63, track: "both", annualFees: "$1,380" },
      { name: "المحاسبة", minGpa: 50, track: "both", annualFees: "$1,200" },
      { name: "إدارة أعمال", minGpa: 50, track: "both", annualFees: "$1,200" },
      { name: "العلوم المالية والمصرفية", minGpa: 50, track: "both", annualFees: "$1,200" },
      { name: "التسويق", minGpa: 50, track: "both", annualFees: "$1,200" },
      { name: "نظم المعلومات الإدارية", minGpa: 55, track: "both", annualFees: "$1,350" },
      { name: "الشريعة والقانون", minGpa: 50, track: "both", annualFees: "$1,200" },
      { name: "الترجمة", minGpa: 50, track: "both", annualFees: "$1,150" },
      { name: "اللغة الإنجليزية وآدابها", minGpa: 50, track: "both", annualFees: "$1,150" },
      { name: "إذاعة وتلفزيون", minGpa: 55, track: "both", annualFees: "$900" },
      { name: "العلاقات العامة والإعلان", minGpa: 55, track: "both", annualFees: "$900" },
      { name: "الصحافة الإلكترونية", minGpa: 50, track: "both", annualFees: "$900" },
      { name: "الدراسات الإسلامية", minGpa: 50, track: "both", annualFees: "$600" },
      { name: "القرآن الكريم وعلومه", minGpa: 50, track: "both", annualFees: "$600" },
      { name: "اللغة العربية", minGpa: 50, track: "both", annualFees: "$600" },
      { name: "علم نفس", minGpa: 50, track: "both", annualFees: "$800" },
      { name: "رياض أطفال", minGpa: 50, track: "both", annualFees: "$800" },
    ],
  };

  for (const uni of [azal, yemenia]) {
    const [created] = await db
      .insert(universitiesTable)
      .values({ name: uni.name, description: uni.description, order: uni.order, enabled: true })
      .returning();

    let i = 0;
    for (const s of uni.specs) {
      i += 1;
      await db.insert(universitySpecializationsTable).values({
        universityId: created.id,
        name: s.name,
        category: (s as { category?: string }).category || null,
        minGpa: s.minGpa,
        track: s.track,
        durationYears: (s as { durationYears?: number }).durationYears || null,
        annualFees: s.annualFees || null,
        notes: null,
        order: i,
        enabled: true,
      });
    }
  }

  const data = await listUniversitiesWithSpecs(false);
  res.status(201).json(data);
});

export default router;
