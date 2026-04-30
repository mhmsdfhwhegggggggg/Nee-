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
        CREATE TABLE IF NOT EXISTS contact_info (
          id SERIAL PRIMARY KEY,
          phone1 TEXT NOT NULL DEFAULT '+967 1 234 567',
          phone2 TEXT NOT NULL DEFAULT '+967 777 123 456',
          email1 TEXT NOT NULL DEFAULT 'info@almossah.org',
          email2 TEXT NOT NULL DEFAULT 'support@almossah.org',
          address TEXT NOT NULL DEFAULT 'الجمهورية اليمنية - أمانة العاصمة - شارع الزبيري',
          address_detail TEXT NOT NULL DEFAULT 'تقاطع شارع بغداد، مبنى المركز التجاري',
          work_hours TEXT NOT NULL DEFAULT 'السبت - الخميس: 8:00 صباحاً - 4:00 مساءً',
          work_hours_off TEXT NOT NULL DEFAULT 'الجمعة: مغلق',
          facebook_url TEXT NOT NULL DEFAULT '',
          twitter_url TEXT NOT NULL DEFAULT '',
          instagram_url TEXT NOT NULL DEFAULT '',
          youtube_url TEXT NOT NULL DEFAULT '',
          linkedin_url TEXT NOT NULL DEFAULT '',
          whatsapp_number TEXT NOT NULL DEFAULT '',
          map_embed_url TEXT NOT NULL DEFAULT '',
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
      `);
      await pool.query(`
        CREATE TABLE IF NOT EXISTS news (
          id SERIAL PRIMARY KEY,
          title TEXT NOT NULL,
          excerpt TEXT NOT NULL,
          content TEXT NOT NULL,
          image_url TEXT,
          type TEXT NOT NULL DEFAULT 'news',
          published BOOLEAN NOT NULL DEFAULT true,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
      `);
      await pool.query(`
        CREATE TABLE IF NOT EXISTS partners (
          id SERIAL PRIMARY KEY,
          name TEXT NOT NULL,
          logo_url TEXT NOT NULL,
          website TEXT,
          type TEXT NOT NULL DEFAULT 'university',
          "order" INTEGER NOT NULL DEFAULT 0,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
      `);
      await pool.query(`
        CREATE TABLE IF NOT EXISTS team (
          id SERIAL PRIMARY KEY,
          name TEXT NOT NULL,
          role TEXT NOT NULL,
          bio TEXT,
          image_url TEXT,
          "order" INTEGER NOT NULL DEFAULT 0,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
      `);
      await pool.query(`
        CREATE TABLE IF NOT EXISTS stats (
          id SERIAL PRIMARY KEY,
          years_experience INTEGER NOT NULL DEFAULT 15,
          programs INTEGER NOT NULL DEFAULT 50,
          beneficiaries INTEGER NOT NULL DEFAULT 10000,
          experts INTEGER NOT NULL DEFAULT 200,
          universities INTEGER NOT NULL DEFAULT 30,
          partners INTEGER NOT NULL DEFAULT 50,
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
      `);
      await pool.query(`
        CREATE TABLE IF NOT EXISTS homepage_slides (
          id SERIAL PRIMARY KEY,
          title TEXT NOT NULL,
          subtitle TEXT,
          url TEXT NOT NULL,
          type TEXT NOT NULL DEFAULT 'image',
          active BOOLEAN NOT NULL DEFAULT true,
          "order" INTEGER NOT NULL DEFAULT 0,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
      `);
      await pool.query(`
        CREATE TABLE IF NOT EXISTS universities (
          id SERIAL PRIMARY KEY,
          name TEXT NOT NULL,
          description TEXT,
          logo_url TEXT,
          "order" INTEGER NOT NULL DEFAULT 0,
          enabled BOOLEAN NOT NULL DEFAULT true,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
      `);
      await pool.query(`
        CREATE TABLE IF NOT EXISTS university_specializations (
          id SERIAL PRIMARY KEY,
          university_id INTEGER NOT NULL REFERENCES universities(id) ON DELETE CASCADE,
          name TEXT NOT NULL,
          category TEXT,
          min_gpa REAL NOT NULL DEFAULT 0,
          track TEXT NOT NULL DEFAULT 'both',
          duration_years INTEGER,
          annual_fees TEXT,
          notes TEXT,
          "order" INTEGER NOT NULL DEFAULT 0,
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

      const missingCols = [
        { col: 'gpa', type: 'TEXT' },
        { col: 'department', type: 'TEXT' },
        { col: 'university_choice_1', type: 'TEXT' },
        { col: 'university_choice_2', type: 'TEXT' },
        { col: 'university_choice_3', type: 'TEXT' },
        { col: 'specialization_choice_1', type: 'TEXT' },
        { col: 'specialization_choice_2', type: 'TEXT' },
        { col: 'specialization_choice_3', type: 'TEXT' },
        { col: 'certificate_image_url', type: 'TEXT' },
        { col: 'updated_at', type: 'TIMESTAMPTZ NOT NULL DEFAULT NOW()' },
      ];

      for (const { col, type } of missingCols) {
        try {
          await pool.query(`ALTER TABLE registrations ADD COLUMN IF NOT EXISTS "${col}" ${type}`);
        } catch {
        }
      }
      try {
        await pool.query(`ALTER TABLE registrations ADD COLUMN IF NOT EXISTS extra_data JSONB`);
      } catch {}
      await pool.query(`ALTER TABLE contact_info ADD COLUMN IF NOT EXISTS phone1 TEXT NOT NULL DEFAULT '+967 1 234 567'`);
      await pool.query(`ALTER TABLE contact_info ADD COLUMN IF NOT EXISTS phone2 TEXT NOT NULL DEFAULT '+967 777 123 456'`);
      await pool.query(`ALTER TABLE contact_info ADD COLUMN IF NOT EXISTS email1 TEXT NOT NULL DEFAULT 'info@almossah.org'`);
      await pool.query(`ALTER TABLE contact_info ADD COLUMN IF NOT EXISTS email2 TEXT NOT NULL DEFAULT 'support@almossah.org'`);
      await pool.query(`ALTER TABLE contact_info ADD COLUMN IF NOT EXISTS address TEXT NOT NULL DEFAULT 'الجمهورية اليمنية - أمانة العاصمة - شارع الزبيري'`);
      await pool.query(`ALTER TABLE contact_info ADD COLUMN IF NOT EXISTS address_detail TEXT NOT NULL DEFAULT 'تقاطع شارع بغداد، مبنى المركز التجاري'`);
      await pool.query(`ALTER TABLE contact_info ADD COLUMN IF NOT EXISTS work_hours TEXT NOT NULL DEFAULT 'السبت - الخميس: 8:00 صباحاً - 4:00 مساءً'`);
      await pool.query(`ALTER TABLE contact_info ADD COLUMN IF NOT EXISTS work_hours_off TEXT NOT NULL DEFAULT 'الجمعة: مغلق'`);
      await pool.query(`ALTER TABLE contact_info ADD COLUMN IF NOT EXISTS facebook_url TEXT NOT NULL DEFAULT ''`);
      await pool.query(`ALTER TABLE contact_info ADD COLUMN IF NOT EXISTS twitter_url TEXT NOT NULL DEFAULT ''`);
      await pool.query(`ALTER TABLE contact_info ADD COLUMN IF NOT EXISTS instagram_url TEXT NOT NULL DEFAULT ''`);
      await pool.query(`ALTER TABLE contact_info ADD COLUMN IF NOT EXISTS youtube_url TEXT NOT NULL DEFAULT ''`);
      await pool.query(`ALTER TABLE contact_info ADD COLUMN IF NOT EXISTS linkedin_url TEXT NOT NULL DEFAULT ''`);
      await pool.query(`ALTER TABLE contact_info ADD COLUMN IF NOT EXISTS whatsapp_number TEXT NOT NULL DEFAULT ''`);
      await pool.query(`ALTER TABLE contact_info ADD COLUMN IF NOT EXISTS map_embed_url TEXT NOT NULL DEFAULT ''`);
      await pool.query(`ALTER TABLE contact_info ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()`);
      await pool.query(`ALTER TABLE news ADD COLUMN IF NOT EXISTS published BOOLEAN NOT NULL DEFAULT true`);
      await pool.query(`ALTER TABLE news ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()`);
      await pool.query(`ALTER TABLE partners ADD COLUMN IF NOT EXISTS website TEXT`);
      await pool.query(`ALTER TABLE partners ADD COLUMN IF NOT EXISTS type TEXT NOT NULL DEFAULT 'university'`);
      await pool.query(`ALTER TABLE partners ADD COLUMN IF NOT EXISTS "order" INTEGER NOT NULL DEFAULT 0`);
      await pool.query(`ALTER TABLE partners ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()`);
      await pool.query(`ALTER TABLE team ADD COLUMN IF NOT EXISTS bio TEXT`);
      await pool.query(`ALTER TABLE team ADD COLUMN IF NOT EXISTS image_url TEXT`);
      await pool.query(`ALTER TABLE team ADD COLUMN IF NOT EXISTS "order" INTEGER NOT NULL DEFAULT 0`);
      await pool.query(`ALTER TABLE team ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()`);
      await pool.query(`ALTER TABLE stats ADD COLUMN IF NOT EXISTS programs INTEGER NOT NULL DEFAULT 50`);
      await pool.query(`ALTER TABLE stats ADD COLUMN IF NOT EXISTS experts INTEGER NOT NULL DEFAULT 200`);

      const formSeed = [
        { key: "universityChoice1", label: "الجامعة - الخيار الأول", type: "university_choice", placeholder: "اختر الجامعة الأولى", required: true, sort: 8 },
        { key: "universityChoice2", label: "الجامعة - الخيار الثاني (اختياري)", type: "university_choice", placeholder: "اختر الجامعة الثانية", required: false, sort: 9 },
        { key: "universityChoice3", label: "الجامعة - الخيار الثالث (اختياري)", type: "university_choice", placeholder: "اختر الجامعة الثالثة", required: false, sort: 10 },
      ];
      for (const f of formSeed) {
        try {
          await pool.query(
            `INSERT INTO registration_form_fields (field_key, label, field_type, placeholder, required, sort_order, enabled)
             SELECT $1, $2, $3, $4, $5, $6, true
             WHERE NOT EXISTS (SELECT 1 FROM registration_form_fields WHERE field_key = $1)`,
            [f.key, f.label, f.type, f.placeholder, f.required, f.sort]
          );
        } catch {
        }
      }

      logger.info("Database tables ensured successfully");
    } catch (err) {
      logger.error({ err }, "Failed to ensure tables");
      throw err;
    }
  }

  const tablesReady = ensureTables();

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

  app.use(async (_req, res, next) => {
    try {
      await tablesReady;
      next();
    } catch {
      res.status(500).json({ error: "Database initialization failed" });
    }
  });

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
  