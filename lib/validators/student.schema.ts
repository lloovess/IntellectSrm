import { z } from "zod";

// ─── Создание студента ─────────────────────────────────────────────────────

export const createStudentSchema = z.object({
    fullName: z
        .string()
        .min(2, "ФИО должно быть не менее 2 символов")
        .max(200, "ФИО слишком длинное"),
    phone: z
        .string()
        .regex(/^\+?[\d\s\-()]{7,20}$/, "Неверный формат телефона")
        .optional()
        .or(z.literal("")),
    email: z.string().email("Неверный формат email").optional().or(z.literal("")),
    notes: z.string().max(1000).optional(),
    status: z.enum(["active", "inactive", "graduated", "suspended"]).default("active"),

    // Новые поля CRM Boost
    iin: z.string().optional().or(z.literal("")),
    dateOfBirth: z.string().optional().or(z.literal("")), // can be cast to date later
    gender: z.string().optional().or(z.literal("")),
    address: z.string().optional().or(z.literal("")),

    // Данные опекуна (обязательно минимум один)
    guardianName: z.string().min(2, "Укажите ФИО хотя бы одного родителя/опекуна"),
    guardianPhone: z.string().regex(/^\+?[\d\s\-()]{7,20}$/, "Неверный формат телефона родителя"),
    guardianRelationship: z.string().optional().or(z.literal("")),

    // Зачисление
    classId: z.string().uuid("Некорректный класс").optional().or(z.literal("")),
    grade: z.string().max(10).optional().or(z.literal("")), // Legacy
    branchId: z.string().min(1, "Неверный филиал").optional(),
    academicYear: z.string().optional().or(z.literal("")), // Legacy
});

export type CreateStudentInput = z.infer<typeof createStudentSchema>;

// ─── Обновление студента ───────────────────────────────────────────────────

export const updateStudentSchema = createStudentSchema.partial();

export type UpdateStudentInput = z.infer<typeof updateStudentSchema>;

// ─── Фильтры реестра ──────────────────────────────────────────────────────

export const registryFiltersSchema = z.object({
    search: z.string().optional(),
    status: z.enum(["active", "inactive", "graduated", "suspended"]).optional(),
    grade: z.string().optional(),
    branchId: z.string().uuid().optional(),
    page: z.coerce.number().int().min(1).default(1),
    pageSize: z.coerce.number().int().min(5).max(100).default(20),
});

export type RegistryFiltersInput = z.infer<typeof registryFiltersSchema>;
