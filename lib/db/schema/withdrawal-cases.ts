import { pgTable, uuid, text, timestamp, numeric, date } from "drizzle-orm/pg-core";
import { students } from "./students";
import { enrollments } from "./enrollments";

export const withdrawalCases = pgTable("withdrawal_cases", {
    id: uuid("id").primaryKey().defaultRandom(),
    studentId: uuid("student_id").references(() => students.id, { onDelete: 'cascade' }),
    enrollmentId: uuid("enrollment_id").notNull().references(() => enrollments.id, { onDelete: 'cascade' }),
    reason: text("reason").notNull(),
    status: text("status").notNull().default('pending'),
    effectiveDate: date("effective_date"),
    settlementType: text("settlement_type"),
    settlementAmount: numeric("settlement_amount", { precision: 12, scale: 2 }).default('0'),
    approvedBy: uuid("approved_by"),
    approvedAt: timestamp("approved_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type WithdrawalCase = typeof withdrawalCases.$inferSelect;
export type NewWithdrawalCase = typeof withdrawalCases.$inferInsert;
