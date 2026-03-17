import { z } from "zod";

export const transferStudentSchema = z.object({
    studentId: z.string().uuid("Некорректный ID студента"),
    enrollmentId: z.string().uuid("Некорректный ID зачисления"),
    reason: z.string().min(1, "Укажите причину перевода").max(1000, "Причина слишком длинная"),
    effectiveDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Неверный формат даты"),

    // New enrollment details
    newBranchId: z.string().uuid("Некорректный филиал").optional(),
    newClassId: z.string().uuid("Некорректный класс").optional().or(z.literal("")),
    newGrade: z.string().max(10).optional().or(z.literal("")), // Legacy
    newAcademicYear: z.string().optional().or(z.literal("")), // Legacy
});

export type TransferStudentInput = z.infer<typeof transferStudentSchema>;
