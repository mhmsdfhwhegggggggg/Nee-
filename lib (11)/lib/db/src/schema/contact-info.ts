import { pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const contactInfoTable = pgTable("contact_info", {
  id: serial("id").primaryKey(),
  phone1: text("phone1").notNull().default("+967 1 234 567"),
  phone2: text("phone2").notNull().default("+967 777 123 456"),
  email1: text("email1").notNull().default("info@almossah.org"),
  email2: text("email2").notNull().default("support@almossah.org"),
  address: text("address").notNull().default("الجمهورية اليمنية - أمانة العاصمة - شارع الزبيري"),
  addressDetail: text("address_detail").notNull().default("تقاطع شارع بغداد، مبنى المركز التجاري"),
  workHours: text("work_hours").notNull().default("السبت - الخميس: 8:00 صباحاً - 4:00 مساءً"),
  workHoursOff: text("work_hours_off").notNull().default("الجمعة: مغلق"),
  facebookUrl: text("facebook_url").notNull().default(""),
  twitterUrl: text("twitter_url").notNull().default(""),
  instagramUrl: text("instagram_url").notNull().default(""),
  youtubeUrl: text("youtube_url").notNull().default(""),
  linkedinUrl: text("linkedin_url").notNull().default(""),
  whatsappNumber: text("whatsapp_number").notNull().default(""),
  mapEmbedUrl: text("map_embed_url").notNull().default(""),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertContactInfoSchema = createInsertSchema(contactInfoTable).omit({
  id: true,
  updatedAt: true,
});

export type InsertContactInfo = z.infer<typeof insertContactInfoSchema>;
export type ContactInfo = typeof contactInfoTable.$inferSelect;
