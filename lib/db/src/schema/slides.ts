import { pgTable, serial, text, boolean, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const slidesTable = pgTable("homepage_slides", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  subtitle: text("subtitle"),
  url: text("url").notNull(),
  type: text("type").notNull().default("image"),
  active: boolean("active").notNull().default(true),
  order: integer("order").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertSlideSchema = createInsertSchema(slidesTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertSlide = z.infer<typeof insertSlideSchema>;
export type Slide = typeof slidesTable.$inferSelect;
