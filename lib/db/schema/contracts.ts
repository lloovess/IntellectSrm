import { pgTable, uuid, text, date, timestamp, numeric } from "drizzle-orm/pg-core";
import { enrollments } from "./enrollments";

// Synced with real DB schema: 2026-03-01
// Real columns: id, enrollment_id, base_price, discount_amount, prepayment_amount,
//               payment_mode, started_at (date), created_at, contract_number, status,
//               previous_contract_id
// NOT in DB: student_id, start_date, end_date, total_amount, updated_at

export const contracts = pgTable("contracts", {
    id: uuid("id").primaryKey().defaultRandom(),
    enrollmentId: uuid("enrollment_id").notNull().references(() => enrollments.id, { onDelete: "cascade" }),
    basePrice: numeric("base_price", { precision: 12, scale: 2 }).notNull(),
    discountAmount: numeric("discount_amount", { precision: 12, scale: 2 }).notNull().default("0"),
    prepaymentAmount: numeric("prepayment_amount", { precision: 12, scale: 2 }).notNull().default("0"),
    paymentMode: text("payment_mode").notNull(), // monthly, quarterly, full
    startedAt: date("started_at").notNull(),
    paymentDueDay: numeric("payment_due_day").notNull().default("1").$type<number>(),
    contractNumber: text("contract_number"),       // nullable in DB
    status: text("status").notNull().default("active"), // active | completed | cancelled | inactive
    previousContractId: uuid("previous_contract_id"),  // self-ref for renewal chain
    currency: text("currency").notNull().default("KGS"), // KGS | USD
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export type Contract = typeof contracts.$inferSelect;
export type NewContract = typeof contracts.$inferInsert;
