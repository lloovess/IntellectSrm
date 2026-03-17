import { z } from "zod";

export const recordPaymentSchema = z.object({
    paymentItemId: z.string().uuid("Некорректный ID позиции платежа"),
    amount: z.number().positive("Сумма должна быть положительной"),
    source: z.enum(["cash", "kaspi", "bank_transfer"], {
        error: "Укажите источник оплаты",
    }),
    payerName: z.string().trim().min(2, "Укажите плательщика"),
    payerPhone: z.string().trim().optional(),
    note: z.string().trim().max(500, "Комментарий слишком длинный").optional(),
    paidAt: z.string().optional(), // ISO datetime; defaults to now() if omitted
});

export type RecordPaymentInput = z.infer<typeof recordPaymentSchema>;

export const reversePaymentSchema = z.object({
    transactionId: z.string().uuid("Некорректный ID транзакции"),
    reason: z.string().min(3, "Укажите причину отмены, минимум 3 символа"),
});

export type ReversePaymentInput = z.infer<typeof reversePaymentSchema>;
