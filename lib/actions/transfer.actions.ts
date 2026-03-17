"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { requireAuth } from "@/lib/auth/session";
import { transferStudentSchema, type TransferStudentInput } from "@/lib/validators/transfer.schema";
import { transferService } from "@/lib/services/transfer.service";

export type ActionResult<T = void> =
    | { ok: true; data: T }
    | { ok: false; error: string };

export async function transferStudentAction(
    input: TransferStudentInput
): Promise<ActionResult<{ enrollmentId: string }>> {
    try {
        const user = await requireAuth();

        const parsed = transferStudentSchema.safeParse(input);
        if (!parsed.success) {
            return {
                ok: false,
                error: parsed.error.issues.map((e) => e.message).join(", "),
            };
        }

        const data = parsed.data;

        // Perform the transfer
        const result = await transferService.transferStudent({
            ...data,
            createdBy: user.role === "admin" ? "Администратор" : "Ассистент",
            userId: user.id
        });

        revalidatePath(`/students/${data.studentId}`);
        revalidatePath("/students");
        revalidateTag('dashboard_metrics');

        return { ok: true, data: { enrollmentId: result.enrollmentId } };
    } catch (err) {
        console.error("Transfer error:", err);
        return {
            ok: false,
            error: err instanceof Error ? err.message : "Неизвестная ошибка при переводе ученика",
        };
    }
}
