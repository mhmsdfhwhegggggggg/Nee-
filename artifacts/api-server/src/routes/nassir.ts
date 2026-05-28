import { Router, type IRouter } from "express";
import { db, chatConversations, chatMessages, chatBotSettings, registrationsTable } from "@workspace/db";
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

router.get("/nassir/settings", async (_req, res): Promise<void> => {
  const settings = await ensureSettings();
  res.json(settings);
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
  const platform = (req.body as Record<string, string>)?.platform || "web";
  const [convo] = await db
    .insert(chatConversations)
    .values({ sessionId: randomUUID(), platform })
    .returning();
  res.status(201).json(convo);
});

router.get("/admin/nassir/conversations", async (_req, res): Promise<void> => {
  const convos = await db
    .select()
    .from(chatConversations)
    .orderBy(desc(chatConversations.updatedAt))
    .limit(200);
  res.json(convos);
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

    if (!fullName || !phone || !programType) {
      res.status(400).json({ error: "fullName, phone, programType required" });
      return;
    }

    const id = await autoRegisterFromNassir(
      { fullName, phone, gpa, department, specialtyWanted, city, programType, universityWanted: universityChoice1 },
      "الموقع الإلكتروني",
      conversationId ? parseInt(conversationId, 10) : undefined,
    );

    // Also fill university choices if given
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

  await db.insert(chatMessages).values({ conversationId: id, role: "user", content });

  const history = await db
    .select()
    .from(chatMessages)
    .where(eq(chatMessages.conversationId, id))
    .orderBy(chatMessages.createdAt);

  // Use DB prompt if admin has customised it; otherwise fall back to master prompt
  const sysPrompt = settings.systemPrompt.includes("〔REG〕")
    ? settings.systemPrompt
    : NASSIR_MASTER_PROMPT;

  const msgs: Array<{ role: "system" | "user" | "assistant"; content: string }> = [
    { role: "system", content: sysPrompt },
    ...history.map((m) => ({ role: m.role as "user" | "assistant", content: m.content })),
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
        // Stream to frontend — client strips the 〔REG〕 block itself
        res.write(`data: ${JSON.stringify({ content: delta })}\n\n`);
      }
    }
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "خطأ غير معروف";
    res.write(
      `data: ${JSON.stringify({ content: "عذراً، حدث خطأ أثناء المعالجة: " + msg })}\n\n`,
    );
  }

  // ── Detect & process 〔REG〕 block ────────────────────────────────────────
  const { clean: cleanResponse, regData } = stripRegBlock(fullResponse);

  // Save CLEAN response to DB (without the REG block)
  await db.insert(chatMessages).values({
    conversationId: id,
    role: "assistant",
    content: cleanResponse,
  });
  await db
    .update(chatConversations)
    .set({ updatedAt: new Date() })
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

export default router;
