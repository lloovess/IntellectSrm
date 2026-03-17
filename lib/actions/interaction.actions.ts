"use server";

import { revalidatePath } from "next/cache";
import { requireAuth } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/server";

export type ActionResult = { ok: true } | { ok: false; error: string };

export async function addInteractionLogAction(
    studentId: string,
    data: { type: string; notes: string }
): Promise<ActionResult> {
    try {
        const session = await requireAuth();
        const role = session.role;

        // Assistant, Admin, Call Center, etc., can add logs.
        if (!["assistant", "admin", "call_center", "finance_manager", "accountant"].includes(role)) {
            return { ok: false, error: "Нет прав на добавление записи журнала" };
        }

        if (!data.notes.trim()) {
            return { ok: false, error: "Текст заметки не может быть пустым" };
        }

        const admin = await createAdminClient();
        const { error } = await admin.from("student_interactions").insert({
            student_id: studentId,
            type: data.type || "call",
            notes: data.notes.trim(),
            created_by: session.id || role,
        });

        if (error) return { ok: false, error: error.message };

        revalidatePath(`/students/${studentId}`);
        return { ok: true };
    } catch (err: unknown) {
        const errMessage = err instanceof Error ? err.message : "Неизвестная ошибка";
        return { ok: false, error: errMessage };
    }
}
