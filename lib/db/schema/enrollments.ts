import { pgTable, uuid, text, timestamp } from "drizzle-orm/pg-core";
import { students } from "./students";
import { branches } from "./branches";
import { classes } from "./classes";

export const enrollments = pgTable("enrollments", {
    id: uuid("id").primaryKey().defaultRandom(),
    studentId: uuid("student_id")
        .notNull()
        .references(() => students.id, { onDelete: "cascade" }),
    branchId: uuid("branch_id").references(() => branches.id),
    classId: uuid("class_id").references(() => classes.id),
    grade: text("grade"),           // Legacy compatibility. Later to be removed/migrated.
    academicYear: text("academic_year"),       // "2025-2026"
    status: text("status").notNull(),          // active, paused, dropped, graduated
    createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type Enrollment = typeof enrollments.$inferSelect;
export type NewEnrollment = typeof enrollments.$inferInsert;
