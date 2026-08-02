import { Router, type IRouter } from "express";
import { pool } from "@workspace/db";

const router: IRouter = Router();

// Ensure table exists
pool.query(`
  CREATE TABLE IF NOT EXISTS trainer_applications (
    id SERIAL PRIMARY KEY,
    form_data JSONB NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )
`).catch(() => {});

// Submit application
router.post("/trainer-application/submit", async (req, res): Promise<void> => {
  try {
    const { formData } = req.body;
    if (!formData || typeof formData !== "object") {
      res.status(400).json({ success: false, message: "بيانات النموذج غير صالحة" });
      return;
    }
    await pool.query(
      "INSERT INTO trainer_applications (form_data) VALUES ($1)",
      [JSON.stringify(formData)]
    );
    res.json({
      success: true,
      message: "تم إرسال طلبك بنجاح، سيتم مراجعته والتواصل معك قريباً",
    });
  } catch {
    res.status(500).json({ success: false, message: "حدث خطأ أثناء الإرسال، يرجى المحاولة لاحقاً" });
  }
});

// Get all applications (admin)
router.get("/trainer-application/list", async (req, res): Promise<void> => {
  try {
    const result = await pool.query(
      "SELECT id, form_data, created_at FROM trainer_applications ORDER BY created_at DESC"
    );
    res.json(result.rows);
  } catch {
    res.status(500).json([]);
  }
});

export default router;
