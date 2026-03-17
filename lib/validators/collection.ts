import { z } from "zod";
import { uuidSchema } from "./common";

export const collectionTaskSchema = z.object({
    paymentItemId: uuidSchema,
    studentId: uuidSchema,
    status: z.enum(["open", "in_progress", "promised", "resolved", "closed"]).default("open"),
    assignedTo: uuidSchema.optional().nullable(),
    nextFollowUpDate: z.preprocess((arg) => {
        if (typeof arg == "string" || arg instanceof Date) return new Date(arg);
    }, z.date().optional().nullable()),
});

export const updateCollectionTaskSchema = collectionTaskSchema.partial();

export const collectionNoteSchema = z.object({
    taskId: uuidSchema,
    note: z.string().min(1, "Заметка не может быть пустой"),
});
