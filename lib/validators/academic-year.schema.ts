import { z } from "zod";

export const createAcademicYearSchema = z.object({
    name: z
        .string()
        .min(1, "Name is required")
        .regex(/^\d{4}-\d{4}$/, 'Name must be in format "YYYY-YYYY"'),
    startDate: z.coerce.date().min(new Date("2000-01-01")),
    endDate: z.coerce.date().min(new Date("2000-01-01")),
    status: z.enum(["active", "archived"]).optional().default("active"),
});

export const updateAcademicYearSchema = createAcademicYearSchema.partial();

export const archiveAcademicYearSchema = z.object({
    id: z.string().uuid("Invalid academic year ID"),
});

export type CreateAcademicYearInput = z.infer<
    typeof createAcademicYearSchema
>;
export type UpdateAcademicYearInput = z.infer<
    typeof updateAcademicYearSchema
>;
export type ArchiveAcademicYearInput = z.infer<
    typeof archiveAcademicYearSchema
>;
