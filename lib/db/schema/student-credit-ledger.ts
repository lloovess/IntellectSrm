import { pgTable, uuid, text, timestamp, numeric } from "drizzle-orm/pg-core";
import { students } from "./students";
import { contracts } from "./contracts";
import { paymentTransactions } from "./payment-transactions";

export const studentCreditLedger = pgTable("student_credit_ledger", {
    id: uuid("id").primaryKey().defaultRandom(),
    studentId: uuid("student_id").notNull().references(() => students.id, { onDelete: "cascade" }),
    contractId: uuid("contract_id").references(() => contracts.id, { onDelete: "set null" }),
    paymentTransactionId: uuid("payment_transaction_id").references(() => paymentTransactions.id, { onDelete: "set null" }),
    direction: text("direction").notNull(), // credit | debit
    amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
    reason: text("reason").notNull(),
    createdBy: text("created_by").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export type StudentCreditLedgerEntry = typeof studentCreditLedger.$inferSelect;
export type NewStudentCreditLedgerEntry = typeof studentCreditLedger.$inferInsert;
