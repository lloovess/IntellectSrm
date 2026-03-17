"use server";

import { requireAuth } from "@/lib/auth/session";
import { collectionService } from "@/lib/services/collection.service";
import { collectionRepository } from "@/lib/db/repositories/collection.repo";
import { revalidatePath, revalidateTag } from "next/cache";

type ActionResult = { ok: true } | { ok: false; error: string };

export async function updateTaskStatusAction(input: {
    taskId: string | null;
    studentId: string;
    paymentItemId: string;
    status: string;
    note: string;
}): Promise<ActionResult> {
    try {
        const { role, email } = await requireAuth();

        let taskId = input.taskId;

        // If no task yet — create it first
        if (!taskId) {
            taskId = await collectionService.ensureTask(input.studentId, input.paymentItemId, role);
        }

        await collectionService.updateTaskStatus(taskId, input.status, input.note, role, email);

        revalidatePath("/collections");
        revalidateTag('dashboard_metrics');
        return { ok: true };
    } catch (err) {
        return { ok: false, error: err instanceof Error ? err.message : "Неизвестная ошибка" };
    }
}

export async function createTaskAction(input: {
    studentId: string;
    paymentItemId: string;
}): Promise<{ ok: true; taskId: string } | { ok: false; error: string }> {
    try {
        const { role } = await requireAuth();
        const taskId = await collectionRepository.createTask(input.studentId, input.paymentItemId);
        void role; // RBAC handled inside service
        revalidatePath("/collections");
        revalidateTag('dashboard_metrics');
        return { ok: true, taskId };
    } catch (err) {
        return { ok: false, error: err instanceof Error ? err.message : "Ошибка" };
    }
}
