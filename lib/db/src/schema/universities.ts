import { pgTable, serial, text, integer, boolean, timestamp, real } from "drizzle-orm/pg-core";

export const universitiesTable = pgTable("universities", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  logoUrl: text("logo_url"),
  order: integer("order").notNull().default(0),
  enabled: boolean("enabled").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const universitySpecializationsTable = pgTable("university_specializations", {
  id: serial("id").primaryKey(),
  universityId: integer("university_id").notNull().references(() => universitiesTable.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  category: text("category"),
  minGpa: real("min_gpa").notNull().default(0),
  track: text("track").notNull().default("both"),
  durationYears: integer("duration_years"),
  annualFees: text("annual_fees"),
  notes: text("notes"),
  order: integer("order").notNull().default(0),
  enabled: boolean("enabled").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export type University = typeof universitiesTable.$inferSelect;
export type UniversitySpecialization = typeof universitySpecializationsTable.$inferSelect;
