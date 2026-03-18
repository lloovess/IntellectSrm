import { pgTable, uuid, text, timestamp } from "drizzle-orm/pg-core";
import { students } from "./students";

export const studentInteractions = pgTable("student_interactions", {
    id: uuid("id").primaryKey().defaultRandom(),
    studentId: uuid("student_id")
        .notNull()
        .references(() => students.id, { onDelete: "cascade" }),
    type: text("type").notNull(),               // "call", "message", "meeting", "note"
    notes: text("notes").notNull(),
    createdBy: text("created_by").notNull(),    // ID of the user who added it
    createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type StudentInteraction = typeof studentInteractions.$inferSelect;
export type NewStudentInteraction = typeof studentInteractions.$inferInsert;
