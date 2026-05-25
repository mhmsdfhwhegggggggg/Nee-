import { Router, type IRouter } from "express";
import { pool } from "@workspace/db";

const router: IRouter = Router();

router.get("/university-specialties", async (req, res): Promise<void> => {
  const { university, gpa, department } = req.query as Record<string, string>;

  let query = `SELECT * FROM university_specialties WHERE 1=1`;
  const params: unknown[] = [];
  let idx = 1;

  if (university) {
    query += ` AND university_name = $${idx++}`;
    params.push(university);
  }

  if (gpa) {
    const gpaNum = parseFloat(gpa);
    if (!isNaN(gpaNum)) {
      query += ` AND min_gpa <= $${idx++}`;
      params.push(gpaNum);
    }
  }

  if (department && department !== "all") {
    query += ` AND (department_type = $${idx++} OR department_type = 'all')`;
    params.push(department);
  }

  query += ` ORDER BY specialty_name ASC`;

  const result = await pool.query(query, params);
  res.json(result.rows);
});

router.get("/admin/university-specialties", async (_req, res): Promise<void> => {
  const result = await pool.query(
    `SELECT * FROM university_specialties ORDER BY university_name ASC, specialty_name ASC`
  );
  res.json(result.rows);
});

router.post("/admin/university-specialties", async (req, res): Promise<void> => {
  const { universityName, specialtyName, departmentType, minGpa } = req.body;

  if (!universityName || !specialtyName) {
    res.status(400).json({ error: "universityName and specialtyName are required" });
    return;
  }

  const result = await pool.query(
    `INSERT INTO university_specialties (university_name, specialty_name, department_type, min_gpa)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [universityName, specialtyName, departmentType || "all", parseFloat(minGpa) || 0]
  );
  res.status(201).json(result.rows[0]);
});

router.patch("/admin/university-specialties/:id", async (req, res): Promise<void> => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }

  const { universityName, specialtyName, departmentType, minGpa } = req.body;
  const updates: string[] = [];
  const params: unknown[] = [];
  let idx = 1;

  if (universityName !== undefined) { updates.push(`university_name = $${idx++}`); params.push(universityName); }
  if (specialtyName !== undefined) { updates.push(`specialty_name = $${idx++}`); params.push(specialtyName); }
  if (departmentType !== undefined) { updates.push(`department_type = $${idx++}`); params.push(departmentType); }
  if (minGpa !== undefined) { updates.push(`min_gpa = $${idx++}`); params.push(parseFloat(minGpa) || 0); }
  updates.push(`updated_at = NOW()`);
  params.push(id);

  const result = await pool.query(
    `UPDATE university_specialties SET ${updates.join(", ")} WHERE id = $${idx} RETURNING *`,
    params
  );

  if (result.rows.length === 0) {
    res.status(404).json({ error: "Specialty not found" });
    return;
  }
  res.json(result.rows[0]);
});

router.delete("/admin/university-specialties/:id", async (req, res): Promise<void> => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }

  const result = await pool.query(
    `DELETE FROM university_specialties WHERE id = $1 RETURNING id`,
    [id]
  );

  if (result.rows.length === 0) {
    res.status(404).json({ error: "Specialty not found" });
    return;
  }
  res.sendStatus(204);
});

router.post("/admin/university-specialties/seed", async (_req, res): Promise<void> => {
  const existing = await pool.query(`SELECT COUNT(*) FROM university_specialties`);
  if (parseInt(existing.rows[0].count) > 0) {
    res.json({ message: "Already seeded", count: parseInt(existing.rows[0].count) });
    return;
  }

  const specialties = [
    { university: "جامعة آزال", specialty: "الصيدلة", dept: "علمي", gpa: 70 },
    { university: "جامعة آزال", specialty: "المختبرات", dept: "علمي", gpa: 65 },
    { university: "جامعة آزال", specialty: "العلاج الطبيعي", dept: "علمي", gpa: 65 },
    { university: "جامعة آزال", specialty: "الممرض التخصصي", dept: "علمي", gpa: 65 },
    { university: "جامعة آزال", specialty: "تكنولوجيا التخدير", dept: "علمي", gpa: 63 },
    { university: "جامعة آزال", specialty: "تكنولوجيا الأشعة", dept: "علمي", gpa: 63 },
    { university: "جامعة آزال", specialty: "القبالة", dept: "علمي", gpa: 63 },
    { university: "جامعة آزال", specialty: "التغذية العلاجية والحميات", dept: "علمي", gpa: 65 },
    { university: "جامعة آزال", specialty: "تقنية المعلومات IT", dept: "علمي", gpa: 55 },
    { university: "جامعة آزال", specialty: "الهندسة المدنية", dept: "علمي", gpa: 66 },
    { university: "جامعة آزال", specialty: "الهندسة المعمارية", dept: "علمي", gpa: 65 },
    { university: "جامعة آزال", specialty: "الجرافيكس والتصميم", dept: "علمي", gpa: 60 },
    { university: "جامعة آزال", specialty: "الأمن السيبراني", dept: "علمي", gpa: 60 },
    { university: "جامعة آزال", specialty: "هندسة الشبكات والاتصالات", dept: "علمي", gpa: 65 },
    { university: "جامعة آزال", specialty: "إدارة أعمال", dept: "all", gpa: 50 },
    { university: "جامعة آزال", specialty: "المحاسبة", dept: "all", gpa: 50 },
    { university: "جامعة آزال", specialty: "اللغة الإنجليزية والترجمة", dept: "all", gpa: 50 },
    { university: "جامعة آزال", specialty: "العلوم المالية والمصرفية", dept: "all", gpa: 50 },
    { university: "جامعة آزال", specialty: "نظم المعلومات الإدارية", dept: "all", gpa: 55 },
    { university: "جامعة آزال", specialty: "الإدارة الصحية", dept: "all", gpa: 55 },
    { university: "جامعة آزال", specialty: "إدارة الأعمال الدولية", dept: "all", gpa: 50 },
    { university: "جامعة آزال", specialty: "علوم حاسوب للصم", dept: "all", gpa: 55 },
    { university: "جامعة آزال", specialty: "تربية فكرية ذوي الاحتياجات الخاصة", dept: "all", gpa: 55 },
    { university: "جامعة آزال", specialty: "الإرشاد النفسي والتربوي", dept: "all", gpa: 50 },
    { university: "الجامعة اليمنية", specialty: "الطب البشري", dept: "علمي", gpa: 78 },
    { university: "الجامعة اليمنية", specialty: "طب الأسنان", dept: "علمي", gpa: 75 },
    { university: "الجامعة اليمنية", specialty: "الصيدلة", dept: "علمي", gpa: 70 },
    { university: "الجامعة اليمنية", specialty: "الطب المخبري", dept: "علمي", gpa: 65 },
    { university: "الجامعة اليمنية", specialty: "التغذية العلاجية", dept: "علمي", gpa: 65 },
    { university: "الجامعة اليمنية", specialty: "التمريض العالي", dept: "علمي", gpa: 65 },
    { university: "الجامعة اليمنية", specialty: "القبالة", dept: "علمي", gpa: 63 },
    { university: "الجامعة اليمنية", specialty: "تكنولوجيا المعلومات", dept: "all", gpa: 55 },
    { university: "الجامعة اليمنية", specialty: "الهندسة المعمارية", dept: "علمي", gpa: 60 },
    { university: "الجامعة اليمنية", specialty: "التصميم الجرافيكي والتنميطي", dept: "علمي", gpa: 60 },
    { university: "الجامعة اليمنية", specialty: "الأمن السيبراني والشبكات", dept: "علمي", gpa: 45 },
    { university: "الجامعة اليمنية", specialty: "الهندسة الطبية الحيوية", dept: "علمي", gpa: 65 },
    { university: "الجامعة اليمنية", specialty: "التصميم الداخلي", dept: "علمي", gpa: 63 },
    { university: "الجامعة اليمنية", specialty: "المحاسبة", dept: "all", gpa: 50 },
    { university: "الجامعة اليمنية", specialty: "إدارة أعمال", dept: "all", gpa: 50 },
    { university: "الجامعة اليمنية", specialty: "العلوم المالية والمصرفية", dept: "all", gpa: 50 },
    { university: "الجامعة اليمنية", specialty: "التسويق", dept: "all", gpa: 50 },
    { university: "الجامعة اليمنية", specialty: "نظم المعلومات الإدارية", dept: "all", gpa: 55 },
    { university: "الجامعة اليمنية", specialty: "الشريعة والقانون", dept: "all", gpa: 50 },
    { university: "الجامعة اليمنية", specialty: "الترجمة", dept: "all", gpa: 50 },
    { university: "الجامعة اليمنية", specialty: "اللغة الإنجليزية وآدابها", dept: "all", gpa: 50 },
    { university: "الجامعة اليمنية", specialty: "إذاعة وتلفزيون", dept: "all", gpa: 55 },
    { university: "الجامعة اليمنية", specialty: "العلاقات العامة والإعلان", dept: "all", gpa: 55 },
    { university: "الجامعة اليمنية", specialty: "الصحافة الإلكترونية", dept: "all", gpa: 55 },
    { university: "الجامعة اليمنية", specialty: "الدراسات الإسلامية", dept: "all", gpa: 50 },
    { university: "الجامعة اليمنية", specialty: "القرآن الكريم وعلومه", dept: "all", gpa: 50 },
    { university: "الجامعة اليمنية", specialty: "اللغة العربية", dept: "all", gpa: 50 },
    { university: "الجامعة اليمنية", specialty: "علم نفس", dept: "all", gpa: 50 },
    { university: "الجامعة اليمنية", specialty: "رياض أطفال", dept: "all", gpa: 50 },
  ];

  for (const s of specialties) {
    await pool.query(
      `INSERT INTO university_specialties (university_name, specialty_name, department_type, min_gpa) VALUES ($1, $2, $3, $4)`,
      [s.university, s.specialty, s.dept, s.gpa]
    );
  }

  const count = await pool.query(`SELECT COUNT(*) FROM university_specialties`);
  res.status(201).json({ message: "Seeded successfully", count: parseInt(count.rows[0].count) });
});

export default router;
