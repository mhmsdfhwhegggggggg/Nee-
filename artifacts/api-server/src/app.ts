import express, { type Express } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import session from "express-session";
import router from "./routes";
import { logger } from "./lib/logger";
import { pool } from "@workspace/db";

async function ensureTables() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS registration_form_fields (
        id SERIAL PRIMARY KEY,
        field_key TEXT NOT NULL,
        label TEXT NOT NULL,
        field_type TEXT NOT NULL DEFAULT 'text',
        placeholder TEXT,
        required BOOLEAN NOT NULL DEFAULT true,
        options TEXT,
        sort_order INTEGER NOT NULL DEFAULT 0,
        enabled BOOLEAN NOT NULL DEFAULT true,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);
    await pool.query(`
      CREATE TABLE IF NOT EXISTS admin_credentials (
        username TEXT PRIMARY KEY,
        password_hash TEXT NOT NULL,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);
    await pool.query(`
      CREATE TABLE IF NOT EXISTS registrations (
        id SERIAL PRIMARY KEY,
        full_name TEXT NOT NULL,
        email TEXT NOT NULL,
        phone TEXT NOT NULL,
        city TEXT NOT NULL,
        program_type TEXT NOT NULL,
        message TEXT,
        certificate_image_url TEXT,
        gpa TEXT,
        department TEXT,
        university_choice_1 TEXT,
        university_choice_2 TEXT,
        university_choice_3 TEXT,
        status TEXT NOT NULL DEFAULT 'pending',
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);
  } catch (err) {
    logger.error({ err }, "Failed to ensure tables");
  }
}

ensureTables();

const app: Express = express();

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);

app.use(cors({
  origin: true,
  credentials: true,
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.use(
  session({
    secret: process.env.SESSION_SECRET ?? "almossah-national-secret-2024",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === "production",
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000,
    },
  }),
);

app.use("/api", router);

export default app;
