import { pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const registrationsTable = pgTable("registrations", {
  id: serial("id").primaryKey(),
  fullName: text("full_name").notNull(),
  email: text("email").notNull(),
  phone: text("phone").notNull(),
  city: text("city").notNull(),
  programType: text("program_type").notNull(),
  message: text("message"),
  certificateImageUrl: text("certificate_image_url"),
  gpa: text("gpa"),
  department: text("department"),
  universityChoice1: text("university_choice_1"),
  universityChoice2: text("university_choice_2"),
  universityChoice3: text("university_choice_3"),
  specializationChoice1: text("specialization_choice_1"),
  specializationChoice2: text("specialization_choice_2"),
  specializationChoice3: text("specialization_choice_3"),
  status: text("status").notNull().default("pending"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertRegistrationSchema = createInsertSchema(registrationsTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertRegistration = z.infer<typeof insertRegistrationSchema>;
export type Registration = typeof registrationsTable.$inferSelect;
