import { pgTable, serial, text, integer, boolean, timestamp } from "drizzle-orm/pg-core";

export const registrationFormFieldsTable = pgTable("registration_form_fields", {
  id: serial("id").primaryKey(),
  fieldKey: text("field_key").notNull(),
  label: text("label").notNull(),
  fieldType: text("field_type").notNull().default("text"),
  placeholder: text("placeholder"),
  required: boolean("required").notNull().default(true),
  options: text("options"),
  sortOrder: integer("sort_order").notNull().default(0),
  enabled: boolean("enabled").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export type RegistrationFormField = typeof registrationFormFieldsTable.$inferSelect;
