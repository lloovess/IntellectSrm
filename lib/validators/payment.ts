import { z } from "zod";
import { uuidSchema } from "./common";

export const paymentItemSchema = z.object({
    contractId: uuidSchema,
    studentId: uuidSchema,
    label: z.string().min(1, "Название платежа обязательно"),
    dueDate: z.preprocess((arg) => {
        if (typeof arg == "string" || arg instanceof Date) return new Date(arg);
    }, z.date()),
    amountExpected: z.number().positive().or(z.string().regex(/^\d+(\.\d{1,2})?$/)),
    amountPaid: z.number().min(0).or(z.string().regex(/^\d+(\.\d{1,2})?$/)).default(0),
    status: z.enum(["planned", "partially_paid", "paid", "overdue"]).default("planned"),
});

export const updatePaymentItemSchema = paymentItemSchema.partial();

export const paymentTransactionSchema = z.object({
    paymentItemId: uuidSchema,
    amount: z.number().positive("Сумма транзакции должна быть положительной").or(z.string().regex(/^\d+(\.\d{1,2})?$/)),
    paymentDate: z.preprocess((arg) => {
        if (typeof arg == "string" || arg instanceof Date) return new Date(arg);
    }, z.date()).default(() => new Date()),
    paymentMethod: z.enum(["cash", "card", "bank_transfer", "kaspi"]),
    receiptNumber: z.string().optional().nullable(),
});
