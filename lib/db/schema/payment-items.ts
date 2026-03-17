import { pgTable, uuid, text, date, timestamp, numeric } from "drizzle-orm/pg-core";
import { contracts } from "./contracts";

// Synced with real DB schema: 2026-03-01
// Real columns: id, contract_id, due_date (date), amount, paid_amount, status, created_at, label
// NOT in DB: student_id, amount_expected, amount_paid, updated_at

export const paymentItems = pgTable("payment_items", {
    id: uuid("id").primaryKey().defaultRandom(),
    contractId: uuid("contract_id").notNull().references(() => contracts.id, { onDelete: "cascade" }),
    dueDate: date("due_date").notNull(),
    amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
    paidAmount: numeric("paid_amount", { precision: 12, scale: 2 }).notNull().default("0"),
    status: text("status").notNull(), // planned | partially_paid | paid | overdue
    label: text("label"),           // nullable — month display name e.g. "Сентябрь"
    currency: text("currency").notNull().default("KGS"), // KGS | USD
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export type PaymentItem = typeof paymentItems.$inferSelect;
export type NewPaymentItem = typeof paymentItems.$inferInsert;
