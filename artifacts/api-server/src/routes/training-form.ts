import { Router, type IRouter } from "express";
import { pool } from "@workspace/db";

const router: IRouter = Router();

function isAuthenticated(req: import("express").Request): boolean {
  const crypto = require("crypto");
  const JWT_SECRET = process.env.SESSION_SECRET ?? "almossah-national-secret-2024";
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.slice(7);
    try {
      const dot = token.lastIndexOf(".");
      if (dot === -1) return false;
      const payload = token.slice(0, dot);
      const sig = token.slice(dot + 1);
      const expectedSig = crypto.createHmac("sha256", JWT_SECRET).update(payload).digest("base64url");
      if (sig !== expectedSig) return false;
      const data = JSON.parse(Buffer.from(payload, "base64url").toString());
      return !!(data.exp && data.exp > Date.now());
    } catch { return false; }
  }
  const session = req.session as Record<string, unknown>;
  return !!(session.isAdmin);
}

// ─── Public: get active fields ───────────────────────────────────────────────
router.get("/training-form/fields", async (req, res): Promise<void> => {
  const result = await pool.query<{
    id: number; label: string; field_type: string;
    placeholder: string | null; required: boolean; options: string | null; sort_order: number;
  }>(
    "SELECT id, label, field_type, placeholder, required, options, sort_order FROM training_form_fields WHERE is_active = true ORDER BY sort_order ASC, id ASC"
  );
  res.json(result.rows);
});

// ─── Public: submit form ──────────────────────────────────────────────────────
router.post("/training-form/submit", async (req, res): Promise<void> => {
  const { formData } = req.body;
  if (!formData || typeof formData !== "object") {
    res.status(400).json({ success: false, message: "بيانات النموذج غير صالحة" });
    return;
  }
  await pool.query(
    "INSERT INTO training_form_submissions (form_data) VALUES ($1)",
    [JSON.stringify(formData)]
  );
  res.json({ success: true, message: "تم إرسال النموذج بنجاح، سيتم التواصل معك قريباً" });
});

// ─── Admin: get ALL fields (incl. inactive) ───────────────────────────────────
router.get("/training-form/admin/fields", async (req, res): Promise<void> => {
  if (!isAuthenticated(req)) { res.status(401).json({ error: "Not authenticated" }); return; }
  const result = await pool.query(
    "SELECT * FROM training_form_fields ORDER BY sort_order ASC, id ASC"
  );
  res.json(result.rows);
});

// ─── Admin: add field ─────────────────────────────────────────────────────────
router.post("/training-form/admin/fields", async (req, res): Promise<void> => {
  if (!isAuthenticated(req)) { res.status(401).json({ error: "Not authenticated" }); return; }
  const { label, field_type, placeholder, required, options, sort_order } = req.body;
  if (!label || !field_type) {
    res.status(400).json({ success: false, message: "الاسم ونوع الحقل مطلوبان" });
    return;
  }
  const result = await pool.query(
    `INSERT INTO training_form_fields (label, field_type, placeholder, required, options, sort_order)
     VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
    [label, field_type, placeholder ?? null, required ?? false, options ?? null, sort_order ?? 0]
  );
  res.json({ success: true, field: result.rows[0] });
});

// ─── Admin: update field ──────────────────────────────────────────────────────
router.patch("/training-form/admin/fields/:id", async (req, res): Promise<void> => {
  if (!isAuthenticated(req)) { res.status(401).json({ error: "Not authenticated" }); return; }
  const { id } = req.params;
  const { label, field_type, placeholder, required, options, sort_order, is_active } = req.body;
  const result = await pool.query(
    `UPDATE training_form_fields
     SET label = COALESCE($1, label),
         field_type = COALESCE($2, field_type),
         placeholder = COALESCE($3, placeholder),
         required = COALESCE($4, required),
         options = COALESCE($5, options),
         sort_order = COALESCE($6, sort_order),
         is_active = COALESCE($7, is_active)
     WHERE id = $8 RETURNING *`,
    [label, field_type, placeholder, required, options, sort_order, is_active, id]
  );
  if (result.rows.length === 0) { res.status(404).json({ error: "الحقل غير موجود" }); return; }
  res.json({ success: true, field: result.rows[0] });
});

// ─── Admin: delete field ──────────────────────────────────────────────────────
router.delete("/training-form/admin/fields/:id", async (req, res): Promise<void> => {
  if (!isAuthenticated(req)) { res.status(401).json({ error: "Not authenticated" }); return; }
  await pool.query("DELETE FROM training_form_fields WHERE id = $1", [req.params.id]);
  res.json({ success: true });
});

// ─── Admin: get submissions ───────────────────────────────────────────────────
router.get("/training-form/admin/submissions", async (req, res): Promise<void> => {
  if (!isAuthenticated(req)) { res.status(401).json({ error: "Not authenticated" }); return; }
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;
  const offset = (page - 1) * limit;
  const [rows, count] = await Promise.all([
    pool.query("SELECT * FROM training_form_submissions ORDER BY created_at DESC LIMIT $1 OFFSET $2", [limit, offset]),
    pool.query("SELECT COUNT(*)::int as total FROM training_form_submissions"),
  ]);
  res.json({ items: rows.rows, total: count.rows[0].total, page, limit });
});

// ─── Admin: update submission status ─────────────────────────────────────────
router.patch("/training-form/admin/submissions/:id", async (req, res): Promise<void> => {
  if (!isAuthenticated(req)) { res.status(401).json({ error: "Not authenticated" }); return; }
  const { status, notes } = req.body;
  await pool.query(
    "UPDATE training_form_submissions SET status = COALESCE($1, status), notes = COALESCE($2, notes) WHERE id = $3",
    [status, notes, req.params.id]
  );
  res.json({ success: true });
});

export default router;
