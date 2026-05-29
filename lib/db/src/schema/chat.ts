import { pgTable, serial, text, timestamp, boolean, integer } from "drizzle-orm/pg-core";

export const chatConversations = pgTable("chat_conversations", {
  id: serial("id").primaryKey(),
  sessionId: text("session_id").notNull().unique(),
  platform: text("platform").notNull().default("web"),
  userIdentifier: text("user_identifier"),
  studentName: text("student_name"),
  studentIntent: text("student_intent"), // 'interested' | 'hesitant' | 'registered' | null
  msgCount: integer("msg_count").notNull().default(0),
  adminTakeover: boolean("admin_takeover").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const chatMessages = pgTable("chat_messages", {
  id: serial("id").primaryKey(),
  conversationId: integer("conversation_id").notNull().references(() => chatConversations.id, { onDelete: "cascade" }),
  role: text("role").notNull(), // 'user' | 'assistant' | 'admin'
  content: text("content").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const chatBotSettings = pgTable("chat_bot_settings", {
  id: serial("id").primaryKey(),
  systemPrompt: text("system_prompt").notNull().default("أنت ناصر، مساعد ذكي للمؤسسة الوطنية للتنمية الشاملة."),
  welcomeMessage: text("welcome_message").notNull().default("مرحباً! أنا ناصر 👋 كيف يمكنني مساعدتك؟"),
  isActive: boolean("is_active").notNull().default(true),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});
