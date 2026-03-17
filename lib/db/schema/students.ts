import { pgTable, uuid, text, date, timestamp } from "drizzle-orm/pg-core";

export const students = pgTable("students", {
    id: uuid("id").primaryKey().defaultRandom(),
    fullName: text("full_name").notNull(),
    phone: text("phone"),
    email: text("email"),
    iin: text("iin"),
    dateOfBirth: date("date_of_birth"),
    gender: text("gender"),
    address: text("address"),
    notes: text("notes"),
    status: text("status").notNull().default("active"), // active | inactive | graduated | suspended
    createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type Student = typeof students.$inferSelect;
export type NewStudent = typeof students.$inferInsert;
