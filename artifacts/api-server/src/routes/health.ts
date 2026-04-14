import { Router, type IRouter } from "express";
  import { db, registrationsTable } from "@workspace/db";
  import { sql } from "drizzle-orm";
  import { pool } from "@workspace/db";

  const router: IRouter = Router();

  router.get("/healthz", async (_req, res): Promise<void> => {
    res.json({ status: "ok" });
  });

  router.get("/healthz/db", async (_req, res): Promise<void> => {
    try {
      const result = await pool.query("SELECT 1 as check");
      res.json({ status: "ok", dbConnected: true, result: result.rows[0] });
    } catch (err: any) {
      res.status(500).json({ status: "error", dbConnected: false, error: err.message });
    }
  });

  router.get("/healthz/registrations", async (_req, res): Promise<void> => {
    try {
      const result = await pool.query("SELECT count(*) as total FROM registrations");
      res.json({ status: "ok", total: result.rows[0]?.total });
    } catch (err: any) {
      res.status(500).json({ status: "error", error: err.message, stack: err.stack?.slice(0, 500) });
    }
  });

  export default router;
  