import { Router, type IRouter } from "express";
import { pool } from "@workspace/db";

const router: IRouter = Router();

// Ensure table exists
pool.query(`
  CREATE TABLE IF NOT EXISTS training_surveys (
    id SERIAL PRIMARY KEY,
    form_data JSONB NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )
`).catch(() => {});

// Submit survey
router.post("/training-survey/submit", async (req, res): Promise<void> => {
  try {
    const { formData } = req.body;
    if (!formData || typeof formData !== "object") {
      res.status(400).json({ success: false, message: "بيانات الاستطلاع غير صالحة" });
      return;
    }
    await pool.query(
      "INSERT INTO training_surveys (form_data) VALUES ($1)",
      [JSON.stringify(formData)]
    );
    res.json({
      success: true,
      message: "شكراً لمشاركتك في الاستطلاع، سنستفيد من آرائك في تطوير برامجنا التدريبية",
    });
  } catch {
    res.status(500).json({ success: false, message: "حدث خطأ أثناء الإرسال، يرجى المحاولة لاحقاً" });
  }
});

// Get all survey responses (admin)
router.get("/training-survey/list", async (req, res): Promise<void> => {
  try {
    const result = await pool.query(
      "SELECT id, form_data, created_at FROM training_surveys ORDER BY created_at DESC"
    );
    res.json(result.rows);
  } catch {
    res.status(500).json([]);
  }
});

export default router;
