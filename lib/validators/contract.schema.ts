import { z } from "zod";

// ─── Create Contract Schema ───────────────────────────────────────────────────

export const createContractSchema = z.object({
    contractNumber: z.string().min(1, "Номер договора обязателен"),
    studentId: z.string().uuid("Некорректный ID студента"),
    enrollmentId: z.string().uuid("Некорректный ID зачисления"),
    basePrice: z.number({ error: "Укажите базовую стоимость" }).positive("Цена должна быть положительной"),
    discountPercent: z.number().min(0).max(100).default(0),
    prepayPercent: z.number().min(0).max(100).default(0),
    startDate: z.string().min(1, "Укажите дату начала"),
    months: z.number().int().min(1).max(12).default(9),
    paymentDueDay: z.number().int().min(1).max(31).default(1),
    paymentMode: z.enum(["monthly", "quarterly", "annual"]).default("monthly"),

    // Guardian Data (collected during contract creation)
    guardianId: z.string().uuid("Некорректный ID опекуна").optional(),
    guardianFullName: z.string().min(2, "ФИО опекуна обязательно").optional(),
    guardianIin: z.string().optional(),
    guardianPassport: z.string().optional(),
    guardianAddress: z.string().optional(),
    guardianPhone: z.string().optional(),
});

export type CreateContractInput = z.infer<typeof createContractSchema>;

// ─── Renew Contract Schema ────────────────────────────────────────────────────

export const renewContractSchema = createContractSchema.extend({
    previousContractId: z.string().uuid("Некорректный ID предыдущего договора"),
});

export type RenewContractInput = z.infer<typeof renewContractSchema>;

export const updatePaymentTermsSchema = z.object({
    contractId: z.string().uuid("Некорректный ID договора"),
    studentId: z.string().uuid("Некорректный ID студента"),
    paymentMode: z.enum(["monthly", "quarterly", "annual"]),
    months: z.number().int().min(1).max(12).default(9),
    paymentDueDay: z.number().int().min(1).max(31).default(1),
});

export type UpdatePaymentTermsInput = z.infer<typeof updatePaymentTermsSchema>;

// ─── Months config for Kazakhstan academic year ───────────────────────────────

export const KZ_ACADEMIC_MONTHS = [
    { label: "Сентябрь", month: 9 },
    { label: "Октябрь", month: 10 },
    { label: "Ноябрь", month: 11 },
    { label: "Декабрь", month: 12 },
    { label: "Январь", month: 1 },
    { label: "Февраль", month: 2 },
    { label: "Март", month: 3 },
    { label: "Апрель", month: 4 },
    { label: "Май", month: 5 },
] as const;
