import { pgTable, uuid, text, timestamp } from "drizzle-orm/pg-core";
import { paymentItems } from "./payment-items";
import { students } from "./students";

// Synced with real DB schema: 2026-03-09
// Real columns: id, student_id, payment_item_id, status, note, updated_at
// Status check: no_contact, contacted, promise_to_pay, refused, closed
export const collectionTasks = pgTable("collection_tasks", {
    id: uuid("id").primaryKey().defaultRandom(),
    paymentItemId: uuid("payment_item_id").notNull().references(() => paymentItems.id, { onDelete: 'cascade' }),
    studentId: uuid("student_id").notNull().references(() => students.id, { onDelete: 'cascade' }),
    status: text("status").notNull().default('no_contact'), // no_contact, contacted, promise_to_pay, refused, closed
    note: text("note"),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const collectionNotes = pgTable("collection_notes", {
    id: uuid("id").primaryKey().defaultRandom(),
    taskId: uuid("task_id").notNull().references(() => collectionTasks.id, { onDelete: 'cascade' }),
    note: text("note").notNull(),
    createdBy: uuid("created_by").notNull(), // References auth.users
    createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type CollectionTask = typeof collectionTasks.$inferSelect;
export type NewCollectionTask = typeof collectionTasks.$inferInsert;
export type CollectionNote = typeof collectionNotes.$inferSelect;
export type NewCollectionNote = typeof collectionNotes.$inferInsert;
