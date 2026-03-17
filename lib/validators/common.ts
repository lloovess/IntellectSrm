import { z } from "zod";

export const paginationSchema = z.object({
    page: z.number().int().positive().default(1),
    pageSize: z.number().int().positive().max(100).default(50),
});

export const uuidSchema = z.string().uuid("Неверный ID формат");

export const idParamSchema = z.object({
    id: uuidSchema,
});
