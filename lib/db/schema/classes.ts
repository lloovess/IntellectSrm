import { pgTable, uuid, text, integer, timestamp } from "drizzle-orm/pg-core";
import { branches } from "./branches";
import { academicYears } from "./academic-years";

export const classes = pgTable("classes", {
    id: uuid("id").primaryKey().defaultRandom(),
    branchId: uuid("branch_id")
        .notNull()
        .references(() => branches.id, { onDelete: "cascade" }),
    academicYearId: uuid("academic_year_id")
        .notNull()
        .references(() => academicYears.id, { onDelete: "cascade" }),
    name: text("name").notNull(),               // e.g., "5А"
    academicYear: text("academic_year").notNull(), // e.g., "2025-2026" (denormalized for queries)
    capacity: integer("capacity").notNull().default(20),
    currentEnrollment: integer("current_enrollment").notNull().default(0),
    status: text("status").notNull().default("active"), // active | archived
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type Class = typeof classes.$inferSelect;
export type NewClass = typeof classes.$inferInsert;
