import OpenAI from "openai";
  import { db, chatConversations, chatMessages, chatBotSettings } from "@workspace/db";
  import { eq } from "drizzle-orm";
  import { randomUUID } from "crypto";

  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  export async function getOrCreateConversation(platform: string, userIdentifier: string) {
    const existing = await db
      .select()
      .from(chatConversations)
      .where(eq(chatConversations.userIdentifier, userIdentifier))
      .limit(1);

    if (existing.length > 0) return existing[0];

    const [convo] = await db
      .insert(chatConversations)
      .values({ sessionId: randomUUID(), platform, userIdentifier })
      .returning();
    return convo;
  }

  export async function processMessage(conversationId: number, userContent: string): Promise<string> {
    const settings = await ensureSettings();
    if (!settings.isActive) return "عذراً، المساعد غير متاح حالياً. يرجى المحاولة لاحقاً.";

    await db.insert(chatMessages).values({ conversationId, role: "user", content: userContent });

    const history = await db
      .select()
      .from(chatMessages)
      .where(eq(chatMessages.conversationId, conversationId))
      .orderBy(chatMessages.createdAt);

    const msgs: OpenAI.Chat.ChatCompletionMessageParam[] = [
      { role: "system", content: settings.systemPrompt },
      ...history.map((m) => ({ role: m.role as "user" | "assistant", content: m.content })),
    ];

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      max_completion_tokens: 1024,
      messages: msgs,
    });

    const reply = response.choices[0]?.message?.content || "عذراً، لم أتمكن من معالجة طلبك.";
    await db.insert(chatMessages).values({ conversationId, role: "assistant", content: reply });
    await db.update(chatConversations).set({ updatedAt: new Date() }).where(eq(chatConversations.id, conversationId));
    return reply;
  }

  export async function ensureSettings() {
    const [s] = await db.select().from(chatBotSettings).limit(1);
    if (s) return s;
    const [created] = await db.insert(chatBotSettings).values({}).returning();
    return created;
  }
  