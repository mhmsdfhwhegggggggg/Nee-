import { Router, type IRouter } from "express";
  import { db, chatConversations, chatMessages, chatBotSettings } from "@workspace/db";
  import { eq, desc } from "drizzle-orm";
  import { randomUUID } from "crypto";
  import { ensureSettings, groq, GROQ_MODEL } from "../lib/chatHelper";

  const router: IRouter = Router();

  router.get("/nassir/settings", async (_req, res): Promise<void> => {
    const settings = await ensureSettings();
    res.json(settings);
  });

  router.patch("/admin/nassir/settings", async (req, res): Promise<void> => {
    const { systemPrompt, welcomeMessage, isActive } = req.body;
    const settings = await ensureSettings();
    const update: Record<string, unknown> = {};
    if (systemPrompt !== undefined) update.systemPrompt = systemPrompt;
    if (welcomeMessage !== undefined) update.welcomeMessage = welcomeMessage;
    if (isActive !== undefined) update.isActive = isActive;
    const [updated] = await db.update(chatBotSettings).set(update).where(eq(chatBotSettings.id, settings.id)).returning();
    res.json(updated);
  });

  router.post("/nassir/conversations", async (req, res): Promise<void> => {
    const platform = req.body?.platform || "web";
    const [convo] = await db.insert(chatConversations).values({ sessionId: randomUUID(), platform }).returning();
    res.status(201).json(convo);
  });

  router.get("/admin/nassir/conversations", async (_req, res): Promise<void> => {
    const convos = await db.select().from(chatConversations).orderBy(desc(chatConversations.updatedAt)).limit(100);
    res.json(convos);
  });

  router.get("/admin/nassir/conversations/:id", async (req, res): Promise<void> => {
    const id = parseInt(req.params.id, 10);
    const [convo] = await db.select().from(chatConversations).where(eq(chatConversations.id, id));
    if (!convo) { res.status(404).json({ error: "Not found" }); return; }
    const msgs = await db.select().from(chatMessages).where(eq(chatMessages.conversationId, id)).orderBy(chatMessages.createdAt);
    res.json({ ...convo, messages: msgs });
  });

  router.delete("/admin/nassir/conversations/:id", async (req, res): Promise<void> => {
    const id = parseInt(req.params.id, 10);
    await db.delete(chatConversations).where(eq(chatConversations.id, id));
    res.sendStatus(204);
  });

  router.post("/nassir/conversations/:id/messages", async (req, res): Promise<void> => {
    const id = parseInt(req.params.id, 10);
    const { content } = req.body;
    if (!content?.trim()) { res.status(400).json({ error: "Content required" }); return; }

    const [convo] = await db.select().from(chatConversations).where(eq(chatConversations.id, id));
    if (!convo) { res.status(404).json({ error: "Conversation not found" }); return; }

    const settings = await ensureSettings();

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    if (!settings.isActive) {
      res.write(`data: ${JSON.stringify({ content: "عذراً، المساعد غير متاح حالياً." })}

`);
      res.write(`data: ${JSON.stringify({ done: true })}

`);
      res.end();
      return;
    }

    await db.insert(chatMessages).values({ conversationId: id, role: "user", content });

    const history = await db.select().from(chatMessages).where(eq(chatMessages.conversationId, id)).orderBy(chatMessages.createdAt);

    const msgs: Array<{ role: "system" | "user" | "assistant"; content: string }> = [
      { role: "system", content: settings.systemPrompt },
      ...history.map((m) => ({ role: m.role as "user" | "assistant", content: m.content })),
    ];

    let fullResponse = "";
    try {
      const stream = await groq.chat.completions.create({ model: GROQ_MODEL, max_tokens: 1024, messages: msgs, stream: true });
      for await (const chunk of stream) {
        const delta = chunk.choices[0]?.delta?.content;
        if (delta) {
          fullResponse += delta;
          res.write(`data: ${JSON.stringify({ content: delta })}

`);
        }
      }
      await db.insert(chatMessages).values({ conversationId: id, role: "assistant", content: fullResponse });
      await db.update(chatConversations).set({ updatedAt: new Date() }).where(eq(chatConversations.id, id));
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "خطأ غير معروف";
      res.write(`data: ${JSON.stringify({ content: "حدث خطأ: " + msg })}

`);
    }

    res.write(`data: ${JSON.stringify({ done: true })}

`);
    res.end();
  });

  export default router;
  