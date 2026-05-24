import { pool } from "@workspace/db";
  import { logger } from "./logger";

  export async function runMigrations(): Promise<void> {
    const client = await pool.connect();
    try {
      await client.query(`
        CREATE TABLE IF NOT EXISTS chat_conversations (
          id         SERIAL PRIMARY KEY,
          session_id TEXT NOT NULL UNIQUE,
          platform   TEXT NOT NULL DEFAULT 'web',
          user_identifier TEXT,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS chat_messages (
          id               SERIAL PRIMARY KEY,
          conversation_id  INTEGER NOT NULL
            REFERENCES chat_conversations(id) ON DELETE CASCADE,
          role    TEXT NOT NULL,
          content TEXT NOT NULL,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS chat_bot_settings (
          id             SERIAL PRIMARY KEY,
          system_prompt  TEXT NOT NULL DEFAULT 'أنت ناصر، مساعد ذكي للمؤسسة الوطنية للتنمية الشاملة.',
          welcome_message TEXT NOT NULL DEFAULT 'مرحباً! أنا ناصر 👋 كيف يمكنني مساعدتك؟',
          is_active      BOOLEAN NOT NULL DEFAULT TRUE,
          updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
      `);
      logger.info("Database migrations completed");
    } catch (err) {
      logger.warn({ err }, "Migration warning (tables may already exist)");
    } finally {
      client.release();
    }
  }
  