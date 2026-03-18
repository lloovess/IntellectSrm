import { z } from "zod";

export const transitionPreviewSchema = z.object({
    sourceAcademicYearId: z.string().uuid("Invalid source academic year ID"),
    targetAcademicYearId: z.string().uuid("Invalid target academic year ID"),
    branchId: z.string().uuid("Invalid branch ID").optional(),
});

export const bulkTransitionSchema = z.object({
    sourceAcademicYearId: z.string().uuid("Invalid source academic year ID"),
    targetAcademicYearId: z.string().uuid("Invalid target academic year ID"),
    branchId: z.string().uuid("Invalid branch ID").optional(),
    dryRun: z.boolean().optional().default(false),
});

export type TransitionPreviewInput = z.infer<typeof transitionPreviewSchema>;
export type BulkTransitionInput = z.infer<typeof bulkTransitionSchema>;
