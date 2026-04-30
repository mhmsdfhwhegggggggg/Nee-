import { Router, type IRouter } from "express";
import { eq, asc } from "drizzle-orm";
import { db, registrationFormFieldsTable } from "@workspace/db";
import { pool } from "@workspace/db";

const router: IRouter = Router();

router.get("/registration-form-config", async (_req, res): Promise<void> => {
  const fields = await db
    .select()
    .from(registrationFormFieldsTable)
    .where(eq(registrationFormFieldsTable.enabled, true))
    .orderBy(asc(registrationFormFieldsTable.sortOrder));

  res.json(
    fields.map((f) => ({
      ...f,
      options: f.options ? JSON.parse(f.options) : null,
      createdAt: f.createdAt.toISOString(),
      updatedAt: f.updatedAt.toISOString(),
    }))
  );
});

router.get("/admin/registration-form-config", async (_req, res): Promise<void> => {
  const fields = await db
    .select()
    .from(registrationFormFieldsTable)
    .orderBy(asc(registrationFormFieldsTable.sortOrder));

  res.json(
    fields.map((f) => ({
      ...f,
      options: f.options ? JSON.parse(f.options) : null,
      createdAt: f.createdAt.toISOString(),
      updatedAt: f.updatedAt.toISOString(),
    }))
  );
});

router.post("/admin/registration-form-config", async (req, res): Promise<void> => {
  const { fieldKey, label, fieldType, placeholder, required, options, sortOrder, enabled } = req.body;

  if (!fieldKey || !label) {
    res.status(400).json({ error: "fieldKey and label are required" });
    return;
  }

  const [field] = await db
    .insert(registrationFormFieldsTable)
    .values({
      fieldKey,
      label,
      fieldType: fieldType || "text",
      placeholder: placeholder || null,
      required: required !== false,
      options: options ? JSON.stringify(options) : null,
      sortOrder: sortOrder || 0,
      enabled: enabled !== false,
    })
    .returning();

  res.status(201).json({
    ...field,
    options: field.options ? JSON.parse(field.options) : null,
    createdAt: field.createdAt.toISOString(),
    updatedAt: field.updatedAt.toISOString(),
  });
});

router.patch("/admin/registration-form-config/:id", async (req, res): Promise<void> => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }

  const updateData: Record<string, unknown> = {};
  const { fieldKey, label, fieldType, placeholder, required, options, sortOrder, enabled } = req.body;

  if (fieldKey !== undefined) updateData.fieldKey = fieldKey;
  if (label !== undefined) updateData.label = label;
  if (fieldType !== undefined) updateData.fieldType = fieldType;
  if (placeholder !== undefined) updateData.placeholder = placeholder;
  if (required !== undefined) updateData.required = required;
  if (options !== undefined) updateData.options = options ? JSON.stringify(options) : null;
  if (sortOrder !== undefined) updateData.sortOrder = sortOrder;
  if (enabled !== undefined) updateData.enabled = enabled;

  const [field] = await db
    .update(registrationFormFieldsTable)
    .set(updateData)
    .where(eq(registrationFormFieldsTable.id, id))
    .returning();

  if (!field) {
    res.status(404).json({ error: "Field not found" });
    return;
  }

  res.json({
    ...field,
    options: field.options ? JSON.parse(field.options) : null,
    createdAt: field.createdAt.toISOString(),
    updatedAt: field.updatedAt.toISOString(),
  });
});

router.delete("/admin/registration-form-config/:id", async (req, res): Promise<void> => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }

  const [field] = await db
    .delete(registrationFormFieldsTable)
    .where(eq(registrationFormFieldsTable.id, id))
    .returning();

  if (!field) {
    res.status(404).json({ error: "Field not found" });
    return;
  }

  res.sendStatus(204);
});

router.post("/admin/registration-form-config/seed-defaults", async (req, res): Promise<void> => {
  const reset = req.query.reset === "true";

  const defaultFields = [
    { fieldKey: "fullName", label: "الاسم الرباعي", fieldType: "text", placeholder: "أدخل اسمك الكامل", required: true, options: null, sortOrder: 1 },
    { fieldKey: "phone", label: "رقم الهاتف", fieldType: "text", placeholder: "7xx xxx xxx", required: true, options: null, sortOrder: 2 },
    { fieldKey: "email", label: "البريد الإلكتروني", fieldType: "text", placeholder: "example@email.com", required: true, options: null, sortOrder: 3 },
    { fieldKey: "city", label: "المحافظة/المدينة", fieldType: "select", placeholder: "اختر المحافظة", required: true, options: JSON.stringify(["صنعاء", "عدن", "تعز", "حضرموت", "إب", "الحديدة", "مأرب", "المكلا", "ذمار", "صعدة", "شبوة", "البيضاء", "لحج", "أبين", "الجوف", "رمية", "سقطرى", "المهرة", "ريمة", "الضالع"]), sortOrder: 4 },
    { fieldKey: "department", label: "القسم", fieldType: "select", placeholder: "اختر القسم", required: true, options: JSON.stringify(["علمي", "أدبي"]), sortOrder: 5 },
    { fieldKey: "gpa", label: "المعدل", fieldType: "text", placeholder: "مثال: 85.5", required: true, options: null, sortOrder: 6 },
    { fieldKey: "programType", label: "البرنامج المطلوب", fieldType: "select", placeholder: "اختر البرنامج", required: true, options: JSON.stringify(["منح دراسية", "تخفيضات جامعية", "تأمين طبي", "برامج أكاديمية"]), sortOrder: 7 },
    { fieldKey: "universityChoice1", label: "الجامعة - الخيار الأول", fieldType: "select_with_other", placeholder: "اختر الجامعة الأولى", required: true, options: JSON.stringify(["الجامعة اللبنانية الدولية", "جامعة العلوم والتكنولوجيا", "جامعة سبأ", "جامعة الملكة أروى", "جامعة الأندلس", "جامعة الحكمة", "جامعة دار السلام", "جامعة الناصر", "جامعة المستقبل", "جامعة الجيل الجديد", "جامعة آزال", "جامعة الإيمان", "جامعة المعرفة والعلوم", "جامعة الوطن", "جامعة القرآن الكريم والدراسات الإسلامية", "جامعة الرازي"]), sortOrder: 8 },
    { fieldKey: "universityChoice2", label: "الجامعة - الخيار الثاني (اختياري)", fieldType: "select_with_other", placeholder: "اختر الجامعة الثانية", required: false, options: JSON.stringify(["الجامعة اللبنانية الدولية", "جامعة العلوم والتكنولوجيا", "جامعة سبأ", "جامعة الملكة أروى", "جامعة الأندلس", "جامعة الحكمة", "جامعة دار السلام", "جامعة الناصر", "جامعة المستقبل", "جامعة الجيل الجديد", "جامعة آزال", "جامعة الإيمان", "جامعة المعرفة والعلوم", "جامعة الوطن", "جامعة القرآن الكريم والدراسات الإسلامية", "جامعة الرازي"]), sortOrder: 9 },
    { fieldKey: "universityChoice3", label: "الجامعة - الخيار الثالث (اختياري)", fieldType: "select_with_other", placeholder: "اختر الجامعة الثالثة", required: false, options: JSON.stringify(["الجامعة اللبنانية الدولية", "جامعة العلوم والتكنولوجيا", "جامعة سبأ", "جامعة الملكة أروى", "جامعة الأندلس", "جامعة الحكمة", "جامعة دار السلام", "جامعة الناصر", "جامعة المستقبل", "جامعة الجيل الجديد", "جامعة آزال", "جامعة الإيمان", "جامعة المعرفة والعلوم", "جامعة الوطن", "جامعة القرآن الكريم والدراسات الإسلامية", "جامعة الرازي"]), sortOrder: 10 },
    { fieldKey: "certificateImage", label: "صورة الشهادة الثانوية العامة", fieldType: "image", placeholder: "اضغط لرفع صورة الشهادة", required: false, options: null, sortOrder: 11 },
    { fieldKey: "message", label: "ملاحظات إضافية (اختياري)", fieldType: "textarea", placeholder: "أي تفاصيل أخرى تود إضافتها...", required: false, options: null, sortOrder: 12 },
  ];

  if (reset) {
    // Delete ALL existing fields and re-seed from scratch
    await db.delete(registrationFormFieldsTable);
    await db.insert(registrationFormFieldsTable).values(
      defaultFields.map((f) => ({ ...f, enabled: true }))
    );
  } else {
    // Only add missing fields (non-destructive)
    const existing = await db.select().from(registrationFormFieldsTable);
    const existingKeys = new Set(existing.map((f) => f.fieldKey));
    const missing = defaultFields.filter((f) => !existingKeys.has(f.fieldKey));
    if (missing.length > 0) {
      await db.insert(registrationFormFieldsTable).values(
        missing.map((f) => ({ ...f, enabled: true }))
      );
    }
  }

  const fields = await db
    .select()
    .from(registrationFormFieldsTable)
    .orderBy(asc(registrationFormFieldsTable.sortOrder));

  res.status(201).json(
    fields.map((f) => ({
      ...f,
      options: f.options ? JSON.parse(f.options) : null,
      createdAt: f.createdAt.toISOString(),
      updatedAt: f.updatedAt.toISOString(),
    }))
  );
});

export default router;
