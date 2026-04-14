import { Router, type IRouter } from "express";
  import { db, registrationsTable } from "@workspace/db";
  import { pool } from "@workspace/db";

  const router: IRouter = Router();

  router.get("/healthz", async (_req, res): Promise<void> => {
    res.json({ status: "ok" });
  });

  router.get("/healthz/db", async (_req, res): Promise<void> => {
    try {
      const result = await pool.query("SELECT 1 as check");
      res.json({ status: "ok", dbConnected: true });
    } catch (err: any) {
      res.status(500).json({ status: "error", error: err.message });
    }
  });

  // Run database migrations endpoint (for initial setup)
  router.post("/healthz/migrate", async (_req, res): Promise<void> => {
    try {
      const migrations = [
        `ALTER TABLE registrations ADD COLUMN IF NOT EXISTS gpa TEXT`,
        `ALTER TABLE registrations ADD COLUMN IF NOT EXISTS department TEXT`,
        `ALTER TABLE registrations ADD COLUMN IF NOT EXISTS university_choice_1 TEXT`,
        `ALTER TABLE registrations ADD COLUMN IF NOT EXISTS university_choice_2 TEXT`,
        `ALTER TABLE registrations ADD COLUMN IF NOT EXISTS university_choice_3 TEXT`,
        `ALTER TABLE registrations ADD COLUMN IF NOT EXISTS certificate_image_url TEXT`,
        `ALTER TABLE registrations ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW()`,
      ];
      
      const results = [];
      for (const sql of migrations) {
        try {
          await pool.query(sql);
          results.push({ sql: sql.slice(0, 60), status: 'ok' });
        } catch (err: any) {
          results.push({ sql: sql.slice(0, 60), status: 'error', error: err.message });
        }
      }
      
      res.json({ status: "migrations complete", results });
    } catch (err: any) {
      res.status(500).json({ status: "error", error: err.message });
    }
  });

  router.get("/healthz/drizzle", async (_req, res): Promise<void> => {
    try {
      const items = await db.select().from(registrationsTable).limit(1);
      res.json({ status: "ok", items, count: items.length });
    } catch (err: any) {
      res.status(500).json({ 
        status: "error", 
        error: err.message,
        cause: err.cause?.message
      });
    }
  });

  export default router;
  