import { z } from "zod";
import { uuidSchema } from "./common";

export const studentSchema = z.object({
    firstName: z.string().min(1, "Имя обязательно"),
    lastName: z.string().min(1, "Фамилия обязательна"),
    middleName: z.string().optional().nullable(),
    dateOfBirth: z.preprocess((arg) => {
        if (typeof arg == "string" || arg instanceof Date) return new Date(arg);
    }, z.date().optional().nullable()),
    gender: z.enum(["M", "F", "other"]).optional().nullable(),
    iin: z.string().length(12, "ИИН должен содержать 12 цифр").optional().nullable(),
    pin: z.string().min(4, "ПИН должен содержать минимум 4 символа").optional().nullable(),
    parentName: z.string().optional().nullable(),
    parentPhone: z.string().min(10, "Телефон должен содержать минимум 10 цифр").optional().nullable(),
    email: z.string().email("Неверный формат email").optional().nullable(),
    notes: z.string().optional().nullable(),
    branchId: uuidSchema.optional().nullable(),
});

export const updateStudentSchema = studentSchema.partial();
