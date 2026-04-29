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

router.post("/admin/universities/seed-defaults", async (req, res): Promise<void> => {
  const force = String(req.query.force || "") === "true";
  const existing = await db.select().from(universitiesTable);
  if (existing.length > 0 && !force) {
    res.json({ message: "Universities already exist", count: existing.length });
    return;
  }
  if (existing.length > 0 && force) {
    await db.delete(universitySpecializationsTable);
    await db.delete(universitiesTable);
  }

  const yemenia = {
    name: "الجامعة اليمنية",
    description: "AlYemenia University",
    order: 1,
    specs: [
      { category: "كلية الطب", name: "الطب البشري", minGpa: 78, track: "scientific" },
      { category: "كلية طب الأسنان", name: "طب الأسنان", minGpa: 75, track: "scientific" },
      { category: "كلية الصيدلة", name: "الصيدلة", minGpa: 70, track: "scientific" },
      { category: "كلية العلوم الطبية", name: "الطب المخبري", minGpa: 65, track: "scientific" },
      { category: "كلية العلوم الطبية", name: "التغذية العلاجية", minGpa: 65, track: "scientific" },
      { category: "كلية العلوم الطبية", name: "التمريض العالي", minGpa: 65, track: "scientific" },
      { category: "كلية العلوم الطبية", name: "القبالة", minGpa: 65, track: "scientific" },
      { category: "كلية الهندسة وتكنولوجيا المعلومات", name: "تكنولوجيا المعلومات IT", minGpa: 55, track: "scientific" },
      { category: "كلية الهندسة وتكنولوجيا المعلومات", name: "الهندسة المعمارية", minGpa: 65, track: "scientific" },
      { category: "كلية الهندسة وتكنولوجيا المعلومات", name: "التصميم الجرافيكي والملتيميديا", minGpa: 60, track: "both" },
      { category: "كلية الهندسة وتكنولوجيا المعلومات", name: "الأمن السيبراني والشبكات", minGpa: 55, track: "scientific" },
      { category: "كلية الهندسة وتكنولوجيا المعلومات", name: "الهندسة الطبية الحيوية", minGpa: 60, track: "scientific" },
      { category: "كلية الهندسة وتكنولوجيا المعلومات", name: "التصميم الداخلي", minGpa: 63, track: "both" },
      { category: "كلية العلوم الإدارية والمالية", name: "المحاسبة", minGpa: 50, track: "both" },
      { category: "كلية العلوم الإدارية والمالية", name: "إدارة أعمال", minGpa: 50, track: "both" },
      { category: "كلية العلوم الإدارية والمالية", name: "العلوم المالية والمصرفية", minGpa: 50, track: "both" },
      { category: "كلية العلوم الإدارية والمالية", name: "التسويق", minGpa: 50, track: "both" },
      { category: "كلية العلوم الإدارية والمالية", name: "نظم المعلومات الإدارية", minGpa: 55, track: "both" },
      { category: "كلية الحقوق", name: "الشريعة والقانون", minGpa: 50, track: "both" },
      { category: "كلية الآداب واللغات", name: "الترجمة", minGpa: 50, track: "both" },
      { category: "كلية الآداب واللغات", name: "اللغة الإنجليزية وآدابها", minGpa: 50, track: "both" },
      { category: "كلية الإعلام", name: "إذاعة وتلفزيون", minGpa: 55, track: "both" },
      { category: "كلية الإعلام", name: "العلاقات العامة والإعلان", minGpa: 55, track: "both" },
      { category: "كلية الإعلام", name: "الصحافة الإلكترونية", minGpa: 50, track: "both" },
      { category: "كلية الشريعة", name: "الدراسات الإسلامية", minGpa: 50, track: "both" },
      { category: "كلية الشريعة", name: "القرآن الكريم وعلومه", minGpa: 50, track: "both" },
      { category: "كلية التربية", name: "اللغة العربية", minGpa: 50, track: "both" },
      { category: "كلية التربية", name: "علم نفس", minGpa: 50, track: "both" },
      { category: "كلية التربية", name: "رياض أطفال", minGpa: 50, track: "both" },
    ],
  };

  const hadara = {
    name: "جامعة الحضارة",
    description: "Civilization University",
    order: 2,
    specs: [
      { category: "كلية الطب البشري", name: "طب وجراحة عامة", minGpa: 78, track: "scientific" },
      { category: "كلية العلوم الطبية", name: "طب الأسنان", minGpa: 75, track: "scientific" },
      { category: "كلية العلوم الطبية", name: "صيدلة عامة", minGpa: 70, track: "scientific" },
      { category: "كلية العلوم الطبية", name: "دكتور صيدلي", minGpa: 70, track: "scientific" },
      { category: "كلية العلوم الطبية", name: "التخدير", minGpa: 65, track: "scientific" },
      { category: "كلية العلوم الطبية", name: "علوم مخبرية", minGpa: 65, track: "scientific" },
      { category: "كلية الهندسة", name: "تقنية معلومات", minGpa: 55, track: "scientific" },
      { category: "كلية الهندسة", name: "علوم حاسوب", minGpa: 60, track: "scientific" },
      { category: "كلية الهندسة", name: "هندسة مدنية", minGpa: 60, track: "scientific" },
      { category: "كلية الهندسة", name: "هندسة نظم وإدارة", minGpa: 60, track: "scientific" },
      { category: "كلية الهندسة", name: "هندسة الديكور", minGpa: 65, track: "scientific" },
      { category: "كلية الهندسة", name: "هندسة معمارية", minGpa: 65, track: "scientific" },
      { category: "كلية التجارة", name: "المحاسبة", minGpa: 50, track: "both" },
      { category: "كلية التجارة", name: "إدارة الأعمال", minGpa: 50, track: "both" },
      { category: "كلية التجارة", name: "نظم معلومات إدارية", minGpa: 55, track: "both" },
      { category: "كلية العلوم الإنسانية", name: "الجيوفيزياء", minGpa: 55, track: "both" },
      { category: "كلية العلوم الإنسانية", name: "شريعة وقانون", minGpa: 55, track: "both" },
      { category: "كلية العلوم الإنسانية", name: "علوم سياسية", minGpa: 55, track: "both" },
    ],
  };

  const azal = {
    name: "جامعة أزال للتنمية البشرية",
    description: "Azal University for Human Development",
    order: 3,
    specs: [
      { category: "العلوم الطبية", name: "الصيدلة", minGpa: 70, track: "scientific" },
      { category: "العلوم الطبية", name: "المختبرات", minGpa: 65, track: "both" },
      { category: "العلوم الطبية", name: "العلاج الطبيعي", minGpa: 65, track: "both" },
      { category: "العلوم الطبية", name: "التمريض التخصصي", minGpa: 65, track: "both" },
      { category: "العلوم الطبية", name: "تكنولوجيا التخدير", minGpa: 65, track: "both" },
      { category: "العلوم الطبية", name: "تكنولوجيا الأشعة", minGpa: 63, track: "both" },
      { category: "العلوم الطبية", name: "القبالة", minGpa: 63, track: "scientific" },
      { category: "العلوم الطبية", name: "التغذية العلاجية والحميات", minGpa: 65, track: "both" },
      { category: "الهندسة وتكنولوجيا المعلومات", name: "تقنية المعلومات IT", minGpa: 55, track: "scientific" },
      { category: "الهندسة وتكنولوجيا المعلومات", name: "الهندسة المدنية", minGpa: 65, track: "scientific" },
      { category: "الهندسة وتكنولوجيا المعلومات", name: "الهندسة المعمارية", minGpa: 65, track: "scientific" },
      { category: "الهندسة وتكنولوجيا المعلومات", name: "الجرافيكس والمالتيمديا", minGpa: 60, track: "scientific" },
      { category: "الهندسة وتكنولوجيا المعلومات", name: "الأمن السيبراني", minGpa: 60, track: "scientific" },
      { category: "الهندسة وتكنولوجيا المعلومات", name: "هندسة شبكات والاتصالات", minGpa: 65, track: "scientific" },
      { category: "العلوم الإدارية والإنسانية", name: "إدارة أعمال", minGpa: 50, track: "both" },
      { category: "العلوم الإدارية والإنسانية", name: "المحاسبة", minGpa: 50, track: "both" },
      { category: "العلوم الإدارية والإنسانية", name: "اللغة الإنجليزية والترجمة", minGpa: 50, track: "both" },
      { category: "العلوم الإدارية والإنسانية", name: "العلوم المالية والمصرفية", minGpa: 50, track: "both" },
      { category: "العلوم الإدارية والإنسانية", name: "نظم المعلومات الإدارية", minGpa: 50, track: "both" },
      { category: "العلوم الإدارية والإنسانية", name: "الإدارة الصحية", minGpa: 50, track: "both" },
      { category: "العلوم الإدارية والإنسانية", name: "إدارة الأعمال الدولية", minGpa: 50, track: "both" },
      { category: "تربية أزال", name: "علوم حاسوب للمعلم", minGpa: 48, track: "both" },
      { category: "تربية أزال", name: "تربية ذوي الاحتياجات الخاصة", minGpa: 50, track: "both" },
      { category: "تربية أزال", name: "الإرشاد النفسي والتربوي", minGpa: 55, track: "both" },
    ],
  };

  const naser = {
    name: "جامعة الناصر",
    description: "Al-Naser University",
    order: 4,
    specs: [
      { category: "كلية طب الأسنان", name: "طب وجراحة الفم والأسنان", minGpa: 76, track: "scientific" },
      { category: "كلية العلوم الطبية", name: "صيدلة", minGpa: 69, track: "scientific" },
      { category: "كلية العلوم الطبية", name: "مختبرات", minGpa: 69, track: "scientific" },
      { category: "كلية العلوم الطبية", name: "تمريض", minGpa: 69, track: "scientific" },
      { category: "كلية العلوم الطبية", name: "صحة مجتمع", minGpa: 69, track: "scientific" },
      { category: "كلية العلوم الطبية", name: "تغذية علاجية", minGpa: 69, track: "scientific" },
      { category: "كلية الهندسة وعلوم الحاسوب", name: "تقنية معلومات (إدارة النظم والشبكات)", minGpa: 68, track: "scientific" },
      { category: "كلية الهندسة وعلوم الحاسوب", name: "تقنية معلومات (تكنولوجيا الويب والموبايل)", minGpa: 68, track: "scientific" },
      { category: "كلية الهندسة وعلوم الحاسوب", name: "الأمن السيبراني والتحري الرقمي", minGpa: 68, track: "scientific" },
      { category: "كلية الهندسة وعلوم الحاسوب", name: "الذكاء الاصطناعي", minGpa: 68, track: "scientific" },
      { category: "كلية الهندسة وعلوم الحاسوب", name: "علوم البيانات", minGpa: 71, track: "scientific" },
      { category: "كلية الهندسة وعلوم الحاسوب", name: "هندسة مدنية", minGpa: 71, track: "scientific" },
      { category: "كلية الهندسة وعلوم الحاسوب", name: "هندسة معمارية", minGpa: 71, track: "scientific" },
      { category: "كلية العلوم الإدارية والمالية", name: "نظم معلومات إدارية", minGpa: 58, track: "both" },
      { category: "كلية العلوم الإدارية والمالية", name: "إدارة مستشفيات", minGpa: 58, track: "both" },
      { category: "كلية العلوم الإدارية والمالية", name: "محاسبة", minGpa: 58, track: "both" },
      { category: "كلية العلوم الإدارية والمالية", name: "تسويق", minGpa: 58, track: "both" },
      { category: "كلية العلوم الإدارية والمالية", name: "إدارة أعمال", minGpa: 58, track: "both" },
      { category: "كلية العلوم الإدارية والمالية", name: "علوم مالية ومصرفية", minGpa: 58, track: "both" },
      { category: "كلية العلوم الإنسانية", name: "لغة عربية", minGpa: 53, track: "both" },
      { category: "كلية العلوم الإنسانية", name: "لغة إنجليزية - ترجمة", minGpa: 55, track: "both" },
      { category: "كلية العلوم الإنسانية", name: "شريعة وقانون", minGpa: 53, track: "both" },
      { category: "كلية العلوم الإنسانية", name: "دراسات إسلامية", minGpa: 53, track: "both" },
      { category: "كلية العلوم الإنسانية", name: "علاقات عامة وإعلان", minGpa: 55, track: "both" },
    ],
  };

  const saeeda = {
    name: "جامعة السعيدة",
    description: "Al-Saeeda University - Sana'a Branch",
    order: 5,
    specs: [
      { category: "كلية الطب البشري", name: "الطب البشري", minGpa: 78, track: "scientific" },
      { category: "كلية العلوم الطبية", name: "طب الأسنان", minGpa: 76, track: "scientific" },
      { category: "كلية العلوم الطبية", name: "الصيدلة", minGpa: 76, track: "scientific" },
      { category: "كلية العلوم الطبية", name: "دكتور صيدلي", minGpa: 76, track: "scientific" },
      { category: "كلية العلوم الطبية", name: "التخدير", minGpa: 71, track: "scientific" },
      { category: "كلية العلوم الطبية", name: "التمريض", minGpa: 69, track: "scientific" },
      { category: "كلية العلوم الطبية", name: "القبالة", minGpa: 69, track: "scientific" },
      { category: "كلية العلوم الطبية", name: "المختبرات", minGpa: 69, track: "scientific" },
      { category: "كلية العلوم الطبية", name: "الأشعة", minGpa: 69, track: "scientific" },
      { category: "كلية الهندسة وتقنية المعلومات", name: "تكنولوجيا المعلومات", minGpa: 68, track: "scientific" },
      { category: "كلية الهندسة وتقنية المعلومات", name: "هندسة معمارية", minGpa: 65, track: "scientific" },
      { category: "كلية الهندسة وتقنية المعلومات", name: "هندسة مدنية", minGpa: 63, track: "scientific" },
      { category: "كلية الهندسة وتقنية المعلومات", name: "هندسة الشبكات والاتصالات", minGpa: 65, track: "scientific" },
      { category: "كلية العلوم الإدارية والإنسانية", name: "المحاسبة", minGpa: 58, track: "both" },
      { category: "كلية العلوم الإدارية والإنسانية", name: "إدارة أعمال", minGpa: 58, track: "both" },
      { category: "كلية العلوم الإدارية والإنسانية", name: "نظم معلومات إدارية", minGpa: 58, track: "both" },
      { category: "كلية العلوم الإدارية والإنسانية", name: "العلوم المالية والمصرفية", minGpa: 58, track: "both" },
      { category: "كلية العلوم الإدارية والإنسانية", name: "الشريعة والقانون", minGpa: 58, track: "both" },
      { category: "كلية العلوم الإدارية والإنسانية", name: "اللغة الإنجليزية والترجمة", minGpa: 58, track: "both" },
    ],
  };

  const razi = {
    name: "جامعة الرازي",
    description: "Al-Razi University",
    order: 6,
    specs: [
      { category: "كلية الطب والعلوم الصحية", name: "الطب والجراحة العامة", minGpa: 78, track: "scientific" },
      { category: "كلية الطب والعلوم الصحية", name: "دكتور صيدلي", minGpa: 70, track: "scientific" },
      { category: "كلية الطب والعلوم الصحية", name: "صيدلة", minGpa: 70, track: "scientific" },
      { category: "كلية الطب والعلوم الصحية", name: "علاج طبيعي", minGpa: 65, track: "scientific" },
      { category: "كلية الطب والعلوم الصحية", name: "تمريض", minGpa: 65, track: "scientific" },
      { category: "كلية الطب والعلوم الصحية", name: "قبالة", minGpa: 65, track: "scientific" },
      { category: "كلية الطب والعلوم الصحية", name: "تغذية علاجية", minGpa: 65, track: "scientific" },
      { category: "كلية الطب والعلوم الصحية", name: "صحة المجتمع", minGpa: 65, track: "scientific" },
      { category: "كلية الطب والعلوم الصحية", name: "رعاية تنفسية", minGpa: 63, track: "scientific" },
      { category: "كلية الطب والعلوم الصحية", name: "علوم طبية حيوية", minGpa: 65, track: "scientific" },
      { category: "كلية طب الأسنان", name: "طب وجراحة الفم والأسنان", minGpa: 75, track: "scientific" },
      { category: "كلية العلوم الإدارية والإنسانية", name: "محاسبة", minGpa: 50, track: "both" },
      { category: "كلية العلوم الإدارية والإنسانية", name: "محاسبة إنجليزي", minGpa: 50, track: "both" },
      { category: "كلية العلوم الإدارية والإنسانية", name: "تمويل واستثمار", minGpa: 55, track: "both" },
      { category: "كلية العلوم الإدارية والإنسانية", name: "إدارة أعمال", minGpa: 50, track: "both" },
      { category: "كلية العلوم الإدارية والإنسانية", name: "علوم مالية ومصرفية", minGpa: 50, track: "both" },
      { category: "كلية العلوم الإدارية والإنسانية", name: "تسويق", minGpa: 55, track: "both" },
      { category: "كلية العلوم الإدارية والإنسانية", name: "الشريعة والقانون", minGpa: 50, track: "both" },
      { category: "كلية العلوم الإدارية والإنسانية", name: "إدارة أعمال دولية - عربي", minGpa: 50, track: "both" },
      { category: "كلية العلوم الإدارية والإنسانية", name: "إدارة أعمال دولية - إنجليزي", minGpa: 50, track: "both" },
      { category: "كلية العلوم الإدارية والإنسانية", name: "الأعمال والتجارة الإلكترونية", minGpa: 55, track: "both" },
      { category: "كلية الحاسوب وتقنية المعلومات", name: "علوم حاسوب", minGpa: 60, track: "scientific" },
      { category: "كلية الحاسوب وتقنية المعلومات", name: "تقنية معلومات", minGpa: 55, track: "scientific" },
      { category: "كلية الحاسوب وتقنية المعلومات", name: "نظم معلومات إدارية", minGpa: 60, track: "both" },
      { category: "كلية الحاسوب وتقنية المعلومات", name: "ذكاء اصطناعي", minGpa: 60, track: "scientific" },
      { category: "كلية الحاسوب وتقنية المعلومات", name: "علم البيانات", minGpa: 60, track: "scientific" },
      { category: "كلية الحاسوب وتقنية المعلومات", name: "الجرائم الإلكترونية والأمن المعلوماتي", minGpa: 60, track: "scientific" },
    ],
  };

  const ibnNafees = {
    name: "جامعة ابن النفيس",
    description: "Ibn Al-Nafees University",
    order: 7,
    specs: [
      { category: "كلية العلوم الصحية", name: "طب وجراحة الفم والأسنان", minGpa: 75, track: "scientific" },
      { category: "كلية العلوم الصحية", name: "الصيدلة العامة", minGpa: 70, track: "scientific" },
      { category: "كلية العلوم الصحية", name: "تكنولوجيا التخدير", minGpa: 63, track: "scientific" },
      { category: "كلية العلوم الصحية", name: "المختبرات الطبية", minGpa: 65, track: "scientific" },
      { category: "كلية العلوم الصحية", name: "التمريض", minGpa: 65, track: "scientific" },
      { category: "كلية العلوم الصحية", name: "الصيدلة السريرية", minGpa: 70, track: "scientific" },
      { category: "كلية العلوم الصحية", name: "الرعاية التنفسية", minGpa: 63, track: "scientific" },
      { category: "كلية العلوم الصحية", name: "البصريات وعلوم الرؤية", minGpa: 65, track: "scientific" },
      { category: "كلية العلوم الصحية", name: "القبالة", minGpa: 63, track: "scientific" },
      { category: "كلية العلوم الصحية", name: "العلاج الطبيعي والتأهيل", minGpa: 65, track: "scientific" },
    ],
  };

  const nukhba = {
    name: "جامعة النخبة",
    description: "Al-Nukhba University",
    order: 8,
    specs: [
      { category: "كلية العلوم الطبية", name: "الصيدلة", minGpa: 70, track: "scientific" },
      { category: "كلية العلوم الطبية", name: "المختبرات", minGpa: 65, track: "scientific" },
      { category: "كلية العلوم الطبية", name: "تمريض", minGpa: 65, track: "scientific" },
      { category: "كلية العلوم الطبية", name: "قبالة وتوليد", minGpa: 63, track: "scientific" },
      { category: "كلية الهندسة وتقنية المعلومات", name: "هندسة شبكات والاتصالات", minGpa: 65, track: "scientific" },
      { category: "كلية الهندسة وتقنية المعلومات", name: "هندسة برمجيات", minGpa: 65, track: "scientific" },
      { category: "كلية الهندسة وتقنية المعلومات", name: "الجرافيك والملتيميديا", minGpa: 60, track: "scientific" },
      { category: "كلية الهندسة وتقنية المعلومات", name: "تكنولوجيا المعلومات", minGpa: 55, track: "scientific" },
      { category: "كلية العلوم الإدارية والإنسانية", name: "نظم معلومات إدارية", minGpa: 55, track: "both" },
      { category: "كلية العلوم الإدارية والإنسانية", name: "المحاسبة", minGpa: 50, track: "both" },
      { category: "كلية العلوم الإدارية والإنسانية", name: "إدارة الأعمال", minGpa: 50, track: "both" },
      { category: "كلية العلوم الإدارية والإنسانية", name: "العلوم المالية والمصرفية", minGpa: 50, track: "both" },
      { category: "كلية العلوم الإدارية والإنسانية", name: "الشريعة والقانون", minGpa: 50, track: "both" },
    ],
  };

  const rashid = { name: "جامعة الرشيد", description: "Al-Rashid University", order: 9, specs: [] as Array<{ category?: string; name: string; minGpa: number; track: string }> };
  const modernSciences = { name: "جامعة العلوم الحديثة", description: "Modern Sciences University", order: 10, specs: [] as Array<{ category?: string; name: string; minGpa: number; track: string }> };

  const jeelJadeed = {
    name: "جامعة الجيل الجديد",
    description: "Al-Jeel Al-Jadeed University",
    order: 11,
    specs: [
      { category: "كلية الطب البشري", name: "طب وجراحة عامة", minGpa: 78, track: "scientific" },
      { category: "كلية العلوم الطبية والصحية", name: "طب وجراحة الفم والأسنان", minGpa: 76, track: "scientific" },
      { category: "كلية العلوم الطبية والصحية", name: "الصيدلة", minGpa: 76, track: "scientific" },
      { category: "كلية العلوم الطبية والصحية", name: "الطب المخبري", minGpa: 69, track: "scientific" },
      { category: "كلية العلوم الطبية والصحية", name: "طب الطوارئ", minGpa: 69, track: "scientific" },
      { category: "كلية الهندسة وتكنولوجيا المعلومات", name: "هندسة الميكاترونكس", minGpa: 71, track: "scientific" },
      { category: "كلية الهندسة وتكنولوجيا المعلومات", name: "هندسة الطاقة المتجددة", minGpa: 71, track: "scientific" },
      { category: "كلية الهندسة وتكنولوجيا المعلومات", name: "الهندسة الطبية الحيوية", minGpa: 71, track: "scientific" },
      { category: "كلية الهندسة وتكنولوجيا المعلومات", name: "تكنولوجيا المعلومات", minGpa: 68, track: "scientific" },
      { category: "كلية الهندسة وتكنولوجيا المعلومات", name: "الأمن السيبراني", minGpa: 68, track: "scientific" },
      { category: "كلية الهندسة وتكنولوجيا المعلومات", name: "الذكاء الاصطناعي", minGpa: 68, track: "scientific" },
      { category: "كلية الهندسة وتكنولوجيا المعلومات", name: "الجرافيك والملتيميديا", minGpa: 65, track: "scientific" },
      { category: "كلية الهندسة وتكنولوجيا المعلومات", name: "التصميم الداخلي", minGpa: 63, track: "scientific" },
      { category: "كلية العلوم الإدارية والإنسانية", name: "نظم المعلومات الإدارية", minGpa: 58, track: "both" },
      { category: "كلية العلوم الإدارية والإنسانية", name: "إدارة الأعمال الدولية - عربي", minGpa: 58, track: "both" },
      { category: "كلية العلوم الإدارية والإنسانية", name: "إدارة الأعمال الدولية - إنجليزي", minGpa: 58, track: "both" },
      { category: "كلية العلوم الإدارية والإنسانية", name: "العلوم المالية والمصرفية (بنوك وتأمين)", minGpa: 58, track: "both" },
      { category: "كلية العلوم الإدارية والإنسانية", name: "المحاسبة", minGpa: 58, track: "both" },
      { category: "كلية العلوم الإدارية والإنسانية", name: "الترجمة", minGpa: 55, track: "both" },
      { category: "كلية العلوم الإدارية والإنسانية", name: "الإعلام والاتصال", minGpa: 58, track: "both" },
      { category: "كلية العلوم الإدارية والإنسانية", name: "القانون", minGpa: 58, track: "both" },
    ],
  };

  const ALL = [yemenia, hadara, azal, naser, saeeda, razi, ibnNafees, nukhba, rashid, modernSciences, jeelJadeed];

  for (const uni of ALL) {
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
        category: s.category || null,
        minGpa: s.minGpa,
        track: s.track,
        durationYears: null,
        annualFees: null,
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
