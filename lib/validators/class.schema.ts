import { z } from "zod";

export const createClassSchema = z.object({
    branchId: z.string().uuid("Invalid branch ID"),
    academicYearId: z.string().uuid("Invalid academic year ID"),
    name: z
        .string()
        .min(1, "Class name is required")
        .max(50, "Class name must be 50 characters or less"),
    academicYear: z.string().min(1, "Academic year text is required"),
    capacity: z
        .number()
        .int("Capacity must be an integer")
        .min(1, "Capacity must be at least 1")
        .max(100, "Capacity must not exceed 100"),
    status: z.enum(["active", "archived"]).optional().default("active"),
});

export const updateClassSchema = createClassSchema.partial();

export const bulkCreateClassesSchema = z.object({
    branchId: z.string().uuid("Invalid branch ID"),
    academicYearId: z.string().uuid("Invalid academic year ID"),
    academicYear: z.string().min(1, "Academic year text is required"),
    classes: z.array(
        z.object({
            name: z.string().min(1, "Class name is required"),
            capacity: z
                .number()
                .int("Capacity must be an integer")
                .min(1, "Capacity must be at least 1")
                .max(100, "Capacity must not exceed 100"),
        })
    ),
});

export const deleteClassSchema = z.object({
    id: z.string().uuid("Invalid class ID"),
});

export type CreateClassInput = z.infer<typeof createClassSchema>;
export type UpdateClassInput = z.infer<typeof updateClassSchema>;
export type BulkCreateClassesInput = z.infer<typeof bulkCreateClassesSchema>;
export type DeleteClassInput = z.infer<typeof deleteClassSchema>;
