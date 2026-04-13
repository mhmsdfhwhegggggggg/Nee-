import { pgTable, serial, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const statsTable = pgTable("stats", {
  id: serial("id").primaryKey(),
  yearsExperience: integer("years_experience").notNull().default(15),
  programs: integer("programs").notNull().default(50),
  beneficiaries: integer("beneficiaries").notNull().default(10000),
  experts: integer("experts").notNull().default(200),
  universities: integer("universities").notNull().default(30),
  partners: integer("partners").notNull().default(50),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertStatsSchema = createInsertSchema(statsTable).omit({
  id: true,
  updatedAt: true,
});

export type InsertStats = z.infer<typeof insertStatsSchema>;
export type Stats = typeof statsTable.$inferSelect;
