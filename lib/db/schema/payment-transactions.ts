import { pgTable, uuid, text, timestamp, numeric, boolean } from "drizzle-orm/pg-core";
import { paymentItems } from "./payment-items";

// Synced with real DB schema: 2026-03-01
// Real columns: id, payment_item_id, amount, paid_at, source, created_by, created_at
// NOT in DB: payment_date, payment_method, receipt_number, processed_by

export const paymentTransactions = pgTable("payment_transactions", {
    id: uuid("id").primaryKey().defaultRandom(),
    paymentItemId: uuid("payment_item_id").notNull().references(() => paymentItems.id, { onDelete: "cascade" }),
    amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
    paidAt: timestamp("paid_at", { withTimezone: true }).notNull(),
    source: text("source").notNull().default("manual"), // cash | kaspi | bank_transfer | manual
    createdBy: text("created_by").notNull(), // user email
    payerName: text("payer_name"),
    payerPhone: text("payer_phone"),
    allocationGroupId: uuid("allocation_group_id"),
    kind: text("kind").notNull().default("payment"), // payment | auto_allocation | advance_credit | advance_apply | reversal
    relatedTransactionId: uuid("related_transaction_id"),
    currency: text("currency").notNull().default("KGS"), // KGS | USD
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),

    // Storno & Audit fields
    isReversed: boolean("is_reversed").notNull().default(false),
    receiptUrl: text("receipt_url"),
    notes: text("notes"),
});

export type PaymentTransaction = typeof paymentTransactions.$inferSelect;
export type NewPaymentTransaction = typeof paymentTransactions.$inferInsert;
