import { pgTable, uuid, text, integer, timestamp } from "drizzle-orm/pg-core";
import { branches } from "./branches";

export const classes = pgTable("classes", {
    id: uuid("id").primaryKey().defaultRandom(),
    branchId: uuid("branch_id")
        .notNull()
        .references(() => branches.id, { onDelete: "cascade" }),
    name: text("name").notNull(),               // e.g., "5А"
    academicYear: text("academic_year").notNull(), // e.g., "2025-2026"
    capacity: integer("capacity").notNull().default(20),
    status: text("status").notNull().default("active"), // active | archived
    createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type Class = typeof classes.$inferSelect;
export type NewClass = typeof classes.$inferInsert;
