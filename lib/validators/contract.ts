import { z } from "zod";
import { uuidSchema } from "./common";

export const contractSchema = z.object({
    contractNumber: z.string().min(1, "Номер договора обязателен"),
    studentId: uuidSchema,
    enrollmentId: uuidSchema,
    startDate: z.preprocess((arg) => {
        if (typeof arg == "string" || arg instanceof Date) return new Date(arg);
    }, z.date()),
    endDate: z.preprocess((arg) => {
        if (typeof arg == "string" || arg instanceof Date) return new Date(arg);
    }, z.date()),
    totalAmount: z.number().positive("Сумма должна быть положительной").or(z.string().regex(/^\d+(\.\d{1,2})?$/)),
    status: z.enum(["active", "completed", "terminated"]).default("active"),
    previousContractId: uuidSchema.optional().nullable(),
});

export const updateContractSchema = contractSchema.partial();
