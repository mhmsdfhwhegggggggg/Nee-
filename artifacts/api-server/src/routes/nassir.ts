import { Router, type IRouter } from "express";
import { db, chatConversations, chatMessages, chatBotSettings, registrationsTable, pool } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import { randomUUID } from "crypto";
import {
  ensureSettings,
  groq,
  GROQ_MODEL,
  extractFormDataFromImage,
  stripRegBlock,
  autoRegisterFromNassir,
  NASSIR_MASTER_PROMPT,
} from "../lib/chatHelper";

const router: IRouter = Router();
  // ── مسار ترحيل قاعدة البيانات (يُستدعى مرة واحدة فقط) ─────────────────────
  router.post("/nassir/migrate", async (_req, res): Promise<void> => {
    const results: Record<string, unknown> = {};
    try {
      // Check table existence
      const tableCheck = await pool.query(`
        SELECT table_name FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name IN ('chat_conversations', 'chat_messages', 'chat_bot_settings')
      `);
      results.existingTables = tableCheck.rows.map((r: Record<string, string>) => r.table_name);

      // Create tables
      await pool.query(`CREATE TABLE IF NOT EXISTS chat_conversations (
        id SERIAL PRIMARY KEY,
        session_id TEXT NOT NULL UNIQUE,
        platform TEXT NOT NULL DEFAULT 'web',
        user_identifier TEXT,
        student_name TEXT,
        student_intent TEXT,
        msg_count INTEGER NOT NULL DEFAULT 0,
        admin_takeover BOOLEAN NOT NULL DEFAULT false,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )`);
      results.chat_conversations = 'ok';

      await pool.query(`CREATE TABLE IF NOT EXISTS chat_messages (
        id SERIAL PRIMARY KEY,
        conversation_id INTEGER NOT NULL REFERENCES chat_conversations(id) ON DELETE CASCADE,
        role TEXT NOT NULL,
        content TEXT NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )`);
      results.chat_messages = 'ok';

      await pool.query(`CREATE TABLE IF NOT EXISTS chat_bot_settings (
        id SERIAL PRIMARY KEY,
        system_prompt TEXT NOT NULL DEFAULT '',
        welcome_message TEXT NOT NULL DEFAULT '',
        is_active BOOLEAN NOT NULL DEFAULT true,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )`);
      results.chat_bot_settings = 'ok';

      // Add missing columns if table already existed without them
      const cols = ['user_identifier', 'student_name', 'student_intent', 'msg_count', 'admin_takeover'];
      for (const col of cols) {
        try {
          const colType = col === 'msg_count' ? 'INTEGER NOT NULL DEFAULT 0'
            : col === 'admin_takeover' ? 'BOOLEAN NOT NULL DEFAULT false'
            : 'TEXT';
          await pool.query(`ALTER TABLE chat_conversations ADD COLUMN IF NOT EXISTS "${col}" ${colType}`);
        } catch (_e) { /* ignore */ }
      }
      results.alterColumns = 'ok';

      // Test INSERT
      const testInsert = await pool.query(
        `INSERT INTO chat_conversations (session_id, platform) VALUES ($1, $2) RETURNING id`,
        ['test-' + Date.now(), 'web']
      );
      const testId = testInsert.rows[0].id;
      await pool.query(`DELETE FROM chat_conversations WHERE id = $1`, [testId]);
      results.testInsert = 'ok (id=' + testId + ', deleted)';

      res.json({ success: true, results });
    } catch (err) {
      res.status(500).json({ success: false, error: String(err), results });
    }
  });

  

router.get("/nassir/settings", async (_req, res): Promise<void> => {
  try {
    const settings = await ensureSettings();
    res.json(settings);
  } catch (err) {
    res.status(500).json({ error: "Failed to load settings", detail: String(err) });
  }
});

router.patch("/admin/nassir/settings", async (req, res): Promise<void> => {
  const { systemPrompt, welcomeMessage, isActive } = req.body as Record<string, unknown>;
  const settings = await ensureSettings();
  const update: Record<string, unknown> = {};
  if (systemPrompt !== undefined) update.systemPrompt = systemPrompt;
  if (welcomeMessage !== undefined) update.welcomeMessage = welcomeMessage;
  if (isActive !== undefined) update.isActive = isActive;
  const [updated] = await db
    .update(chatBotSettings)
    .set(update)
    .where(eq(chatBotSettings.id, settings.id))
    .returning();
  res.json(updated);
});

router.post("/nassir/conversations", async (req, res): Promise<void> => {
  try {
    const platform = (req.body as Record<string, string>)?.platform || "web";
    // Lazy table creation — self-heal if tables are missing
    try {
      await pool.query(`CREATE TABLE IF NOT EXISTS chat_conversations (
        id SERIAL PRIMARY KEY,
        session_id TEXT NOT NULL UNIQUE,
        platform TEXT NOT NULL DEFAULT 'web',
        user_identifier TEXT,
        student_name TEXT,
        student_intent TEXT,
        msg_count INTEGER NOT NULL DEFAULT 0,
        admin_takeover BOOLEAN NOT NULL DEFAULT false,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )`);
      await pool.query(`CREATE TABLE IF NOT EXISTS chat_messages (
        id SERIAL PRIMARY KEY,
        conversation_id INTEGER NOT NULL REFERENCES chat_conversations(id) ON DELETE CASCADE,
        role TEXT NOT NULL,
        content TEXT NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )`);
      await pool.query(`CREATE TABLE IF NOT EXISTS chat_bot_settings (
        id SERIAL PRIMARY KEY,
        system_prompt TEXT NOT NULL DEFAULT '',
        welcome_message TEXT NOT NULL DEFAULT '',
        is_active BOOLEAN NOT NULL DEFAULT true,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )`);
    } catch (_tableErr) { /* tables may already exist */ }
    const [convo] = await db
      .insert(chatConversations)
      .values({ sessionId: randomUUID(), platform })
      .returning();
    res.status(201).json(convo);
  } catch (err: unknown) {
    const e = err as Record<string, unknown>;
    const detail = (e?.cause as Record<string,unknown>)?.message || (e?.message as string) || String(err);
    const pgErr = (e?.cause as Record<string,unknown>)?.code || '';
    res.status(500).json({ error: "Failed to create conversation", detail, pgErr });
  }
});

router.get("/admin/nassir/conversations", async (_req, res): Promise<void> => {
  try {
    const convos = await db
      .select()
      .from(chatConversations)
      .orderBy(desc(chatConversations.updatedAt))
      .limit(200);
    res.json(convos);
  } catch (err) {
    res.status(500).json({ error: "Failed to load conversations", detail: String(err) });
  }
});

router.get("/admin/nassir/conversations/:id", async (req, res): Promise<void> => {
  const id = parseInt(req.params.id, 10);
  const [convo] = await db
    .select()
    .from(chatConversations)
    .where(eq(chatConversations.id, id));
  if (!convo) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  const msgs = await db
    .select()
    .from(chatMessages)
    .where(eq(chatMessages.conversationId, id))
    .orderBy(chatMessages.createdAt);
  res.json({ ...convo, messages: msgs });
});

router.delete("/admin/nassir/conversations/:id", async (req, res): Promise<void> => {
  const id = parseInt(req.params.id, 10);
  await db.delete(chatConversations).where(eq(chatConversations.id, id));
  res.sendStatus(204);
});

// ── Phase 4: Admin sends a message into a conversation (bypasses AI) ─────────
router.post("/admin/nassir/conversations/:id/send", async (req, res): Promise<void> => {
  const id = parseInt(req.params.id, 10);
  const { message } = req.body as { message?: string };
  if (!message?.trim()) {
    res.status(400).json({ error: "message required" });
    return;
  }
  const [convo] = await db.select().from(chatConversations).where(eq(chatConversations.id, id));
  if (!convo) {
    res.status(404).json({ error: "Conversation not found" });
    return;
  }

  // Save admin message to DB as 'admin' role (shown differently in the widget)
  const [savedMsg] = await db
    .insert(chatMessages)
    .values({ conversationId: id, role: "admin", content: message.trim() })
    .returning();

  await db.update(chatConversations).set({ updatedAt: new Date() }).where(eq(chatConversations.id, id));

  // Deliver to the user's platform
  const delivered = await deliverAdminMessage(convo.platform, convo.userIdentifier, message.trim());

  res.json({ success: true, message: savedMsg, delivered });
});

// ── Phase 4: Toggle admin takeover for a conversation ──────────────────────���─
router.patch("/admin/nassir/conversations/:id/takeover", async (req, res): Promise<void> => {
  const id = parseInt(req.params.id, 10);
  const { takeover } = req.body as { takeover?: boolean };
  if (typeof takeover !== "boolean") {
    res.status(400).json({ error: "takeover (boolean) required" });
    return;
  }
  const [convo] = await db
    .update(chatConversations)
    .set({ adminTakeover: takeover, updatedAt: new Date() })
    .where(eq(chatConversations.id, id))
    .returning();
  if (!convo) {
    res.status(404).json({ error: "Not found" });
    return;
  }

  // When releasing takeover on Facebook/Instagram, pass thread control back to AI bot
  if (!takeover && convo.userIdentifier && (convo.platform === "facebook" || convo.platform === "instagram")) {
    const token = convo.platform === "instagram"
      ? (process.env.INSTAGRAM_ACCESS_TOKEN || "")
      : (process.env.FACEBOOK_PAGE_ACCESS_TOKEN || "");
    if (token) {
      await passThreadControlToBot(convo.userIdentifier, token).catch(() => {});
    }
  }

  res.json(convo);
});

// ── Phase 4: SSE live stream — admin dashboard real-time monitoring ───────────
router.get("/admin/nassir/live", async (_req, res): Promise<void> => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.flushHeaders();

  const sendSnapshot = async () => {
    const convos = await db
      .select()
      .from(chatConversations)
      .orderBy(desc(chatConversations.updatedAt))
      .limit(100);
    res.write(`data: ${JSON.stringify({ type: "snapshot", convos })}\n\n`);
  };

  // Send initial snapshot immediately
  await sendSnapshot();

  // Poll every 5 seconds
  const interval = setInterval(async () => {
    try {
      await sendSnapshot();
    } catch {
      clearInterval(interval);
    }
  }, 5000);

  res.on("close", () => clearInterval(interval));
});

// ── Deliver message to social platform ────────────────────────────────────────
async function deliverAdminMessage(platform: string, userId: string | null | undefined, text: string): Promise<boolean> {
  if (!userId) return false;

  if (platform === "facebook") {
    const token = process.env.FACEBOOK_PAGE_ACCESS_TOKEN || "";
    if (!token) return false;
    const res = await fetch("https://graph.facebook.com/v19.0/me/messages", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ recipient: { id: userId }, message: { text } }),
    });
    return res.ok;
  }

  if (platform === "instagram") {
    const token = process.env.INSTAGRAM_ACCESS_TOKEN || "";
    if (!token) return false;
    const res = await fetch("https://graph.facebook.com/v19.0/me/messages", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ recipient: { id: userId }, message: { text } }),
    });
    return res.ok;
  }

  if (platform === "telegram") {
    const token = process.env.TELEGRAM_BOT_TOKEN || "";
    if (!token) return false;
    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: userId, text }),
    });
    return res.ok;
  }

  // For web/other platforms: message is saved to DB, widget will pick it up on next poll
  return true;
}

// ── Facebook Handover Protocol: pass thread control back to AI (bot) ──────────
async function passThreadControlToBot(userId: string, token: string): Promise<void> {
  await fetch("https://graph.facebook.com/v19.0/me/pass_thread_control", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      recipient: { id: userId },
      target_app_id: "263902037430900", // Messenger Platform default inbox app ID
      metadata: "nassir_ai_resumed",
    }),
  });
}

router.post("/nassir/vision/extract", async (req, res): Promise<void> => {
  const { imageBase64, mimeType } = req.body as { imageBase64?: string; mimeType?: string };
  if (!imageBase64) {
    res.status(400).json({ error: "imageBase64 required" });
    return;
  }
  const estimatedBytes = imageBase64.length * 0.75;
  if (estimatedBytes > 3 * 1024 * 1024) {
    res
      .status(413)
      .json({ error: "image_too_large", message: "الصورة كبيرة جداً. يرجى اختيار صورة أصغر أو ضغطها." });
    return;
  }
  try {
    const data = await extractFormDataFromImage(imageBase64, mimeType || "image/jpeg");
    res.json(data);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    req.log?.warn({ err: msg }, "Vision extraction failed");
    res.json({ _error: msg });
  }
});

router.post("/nassir/auto-register", async (req, res): Promise<void> => {
  try {
    const {
      fullName,
      phone,
      email,
      gpa,
      department,
      city,
      programType,
      universityChoice1,
      universityChoice2,
      universityChoice3,
      specialtyWanted,
      conversationId,
    } = req.body as Record<string, string>;

    if (!fullName || !phone) {
      res.status(400).json({ error: "fullName and phone required" });
      return;
    }

    const id = await autoRegisterFromNassir(
      { fullName, phone, email, gpa, department, specialtyWanted, city, programType, universityWanted: universityChoice1 },
      "الموقع الإلكتروني",
      conversationId ? parseInt(conversationId, 10) : undefined,
    );

    if (id && (universityChoice2 || universityChoice3)) {
      await db
        .update(registrationsTable)
        .set({
          universityChoice2: universityChoice2 || undefined,
          universityChoice3: universityChoice3 || undefined,
        })
        .where(eq(registrationsTable.id, id));
    }

    res.json({ success: true, registrationId: id });
  } catch (err) {
    res.status(500).json({ error: "Registration failed", detail: String(err) });
  }
});

// ── SSE streaming chat endpoint ───────────────────────────────────────────────
router.post("/nassir/conversations/:id/messages", async (req, res): Promise<void> => {
  const id = parseInt(req.params.id, 10);
  const { content } = req.body as { content?: string };
  if (!content?.trim()) {
    res.status(400).json({ error: "Content required" });
    return;
  }

  const [convo] = await db
    .select()
    .from(chatConversations)
    .where(eq(chatConversations.id, id));
  if (!convo) {
    res.status(404).json({ error: "Conversation not found" });
    return;
  }

  const settings = await ensureSettings();

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("Access-Control-Allow-Origin", "*");

  if (!settings.isActive) {
    res.write(`data: ${JSON.stringify({ content: "عذراً، المساعد غير متاح حالياً." })}\n\n`);
    res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
    res.end();
    return;
  }

  // Phase 4: Admin takeover — save message but don't AI-respond
  if (convo.adminTakeover) {
    await db.insert(chatMessages).values({ conversationId: id, role: "user", content });
    await db.update(chatConversations).set({ updatedAt: new Date() }).where(eq(chatConversations.id, id));
    res.write(`data: ${JSON.stringify({ adminTakeover: true, done: true })}\n\n`);
    res.end();
    return;
  }

  await db.insert(chatMessages).values({ conversationId: id, role: "user", content });

  const history = await db
    .select()
    .from(chatMessages)
    .where(eq(chatMessages.conversationId, id))
    .orderBy(chatMessages.createdAt);

  const sysPrompt = settings.systemPrompt.includes("〔REG〕")
    ? settings.systemPrompt
    : NASSIR_MASTER_PROMPT;

  const msgs: Array<{ role: "system" | "user" | "assistant"; content: string }> = [
    { role: "system", content: sysPrompt },
    ...history
      .filter((m) => m.role === "user" || m.role === "assistant")
      .map((m) => ({ role: m.role as "user" | "assistant", content: m.content })),
  ];

  let fullResponse = "";
  try {
    const stream = await groq.chat.completions.create({
      model: GROQ_MODEL,
      max_tokens: 800,
      temperature: 0.3,
      messages: msgs,
      stream: true,
    });

    for await (const chunk of stream) {
      const delta = chunk.choices[0]?.delta?.content;
      if (delta) {
        fullResponse += delta;
        res.write(`data: ${JSON.stringify({ content: delta })}\n\n`);
      }
    }
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "خطأ غير معروف";
    res.write(
      `data: ${JSON.stringify({ content: "عذراً، حدث خطأ أثناء المعالجة: " + msg })}\n\n`,
    );
  }

  const { clean: cleanResponse, regData } = stripRegBlock(fullResponse);

  await db.insert(chatMessages).values({
    conversationId: id,
    role: "assistant",
    content: cleanResponse,
  });
  await db
    .update(chatConversations)
    .set({ updatedAt: new Date(), msgCount: (convo.msgCount ?? 0) + 1 })
    .where(eq(chatConversations.id, id));

  if (regData?.fullName && regData?.phone) {
    const regId = await autoRegisterFromNassir(regData, "الموقع الإلكتروني", id);
    if (regId) {
      res.write(
        `data: ${JSON.stringify({
          autoRegistered: true,
          registrationId: regId,
          studentName: regData.fullName,
        })}\n\n`,
      );
    }
  }

  res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
  res.end();
});


// Simple DB connectivity test
  router.get("/nassir/dbtest", async (_req, res): Promise<void> => {
    try {
      const r = await pool.query("SELECT 1 AS ok, version() AS pg_version");
      res.json({ db: "ok", version: r.rows[0].pg_version });
    } catch (err: unknown) {
      const e = err as Record<string, unknown>;
      const cause = e?.cause as Record<string, unknown> | undefined;
      res.status(500).json({
        db: "error",
        message: (e?.message as string) || String(err),
        causeMessage: (cause?.message as string) || null,
        causeCode: (cause?.code as string) || null,
      });
    }
  });
export default router;
