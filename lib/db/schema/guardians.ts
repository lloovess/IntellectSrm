import { pgTable, uuid, text, timestamp } from "drizzle-orm/pg-core";
import { students } from "./students";

export const guardians = pgTable("guardians", {
    id: uuid("id").primaryKey().defaultRandom(),
    studentId: uuid("student_id")
        .notNull()
        .references(() => students.id, { onDelete: "cascade" }),
    fullName: text("full_name").notNull(),
    iin: text("iin"),                           // National ID
    passport: text("passport"),                 // e.g., ID2961245, Выдан МКК 211012 от 09/09/2022
    address: text("address"),                   // e.g., Бакаева 161/1
    phone: text("phone").notNull(),
    email: text("email"),
    relationship: text("relationship"),         // e.g., "Mother", "Father"
    createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type Guardian = typeof guardians.$inferSelect;
export type NewGuardian = typeof guardians.$inferInsert;
