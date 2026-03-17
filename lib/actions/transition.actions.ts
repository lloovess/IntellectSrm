"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { requireAuth } from "@/lib/auth/session";
import { transitionService } from "@/lib/services/transition.service";

export type ActionResult<T = void> =
    | { ok: true; data: T }
    | { ok: false; error: string };

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function getPromotionPreviewAction(sourceYear: string, branchId?: string): Promise<ActionResult<any>> {
    try {
        const user = await requireAuth();
        if (user.role !== "admin") throw new Error("Unauthorized"); // Only admins can see mass promotions

        const preview = await transitionService.getPromotionPreview(sourceYear, branchId);

        return { ok: true, data: preview };
    } catch (err) {
        console.error("Transition preview error:", err);
        return {
            ok: false,
            error: err instanceof Error ? err.message : "Ошибка загрузки списка для перевода",
        };
    }
}

/* eslint-disable @typescript-eslint/no-explicit-any */
export async function promoteStudentsAction(
    promotions: any[],
    dryRun: boolean
): Promise<ActionResult<any>> {
/* eslint-enable @typescript-eslint/no-explicit-any */
    try {
        const user = await requireAuth();
        if (user.role !== "admin") throw new Error("Unauthorized");

        const result = await transitionService.promoteStudents(promotions, dryRun, {
            userId: user.id,
            createdBy: "Администратор"
        });

        if (result.ok) {
            revalidatePath("/operations/transition");
            revalidatePath("/students");
            revalidateTag('dashboard_metrics');
        }

        // Transform service result to ActionResult format
        if (result.ok) {
            return { ok: true, data: { message: result.message, count: result.count } };
        } else {
            return { ok: false, error: result.message };
        }
    } catch (err) {
        console.error("Promotion execution error:", err);
        return {
            ok: false,
            error: err instanceof Error ? err.message : "Неизвестная ошибка при переводе",
        };
    }
}
