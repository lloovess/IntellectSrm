"use server";

import { revalidatePath } from "next/cache";
import { requireAuth } from "@/lib/auth/session";
import { checkPermission } from "@/lib/auth/guard";
import { createAdminClient } from "@/lib/supabase/server";

export type ActionResult<T = void> =
    | { ok: true; data: T }
    | { ok: false; error: string };

export async function createClassAction(data: { name: string; branchId: string; academicYear: string; capacity?: number }): Promise<ActionResult<{ id: string }>> {
    try {
        const { role } = await requireAuth();
        if (!checkPermission(role, "classes.write")) {
            return { ok: false, error: "Нет прав на создание класса" };
        }
        if (!data.name.trim() || !data.branchId || !data.academicYear.trim()) {
            return { ok: false, error: "Заполните все обязательные поля" };
        }

        const admin = await createAdminClient();
        const { data: inserted, error } = await admin
            .from("classes")
            .insert({
                id: crypto.randomUUID(),
                name: data.name.trim(),
                branch_id: data.branchId,
                academic_year: data.academicYear.trim(),
                capacity: data.capacity ?? 20,
            })
            .select("id")
            .single();

        if (error) return { ok: false, error: error.message };
        revalidatePath("/settings");
        return { ok: true, data: inserted as { id: string } };
    } catch (err) {
        return { ok: false, error: err instanceof Error ? err.message : "Неизвестная ошибка" };
    }
}

export async function updateClassAction(id: string, data: { name?: string; academicYear?: string; capacity?: number }): Promise<ActionResult> {
    try {
        const { role } = await requireAuth();
        if (!checkPermission(role, "classes.write")) {
            return { ok: false, error: "Нет прав на изменение класса" };
        }

        const admin = await createAdminClient();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const payload: any = {};
        if (data.name) payload.name = data.name.trim();
        if (data.academicYear) payload.academic_year = data.academicYear.trim();
        if (data.capacity !== undefined) payload.capacity = data.capacity;

        const { error } = await admin
            .from("classes")
            .update(payload)
            .eq("id", id);

        if (error) return { ok: false, error: error.message };
        revalidatePath("/settings");
        return { ok: true, data: undefined };
    } catch (err) {
        return { ok: false, error: err instanceof Error ? err.message : "Неизвестная ошибка" };
    }
}

export async function deleteClassAction(id: string): Promise<ActionResult> {
    try {
        const { role } = await requireAuth();
        if (!checkPermission(role, "classes.write")) {
            return { ok: false, error: "Нет прав на удаление класса" };
        }

        const admin = await createAdminClient();

        // Check if class is in use before deleting
        const { count } = await admin
            .from("enrollments")
            .select("id", { count: "exact", head: true })
            .eq("class_id", id);

        if ((count ?? 0) > 0) {
            return { ok: false, error: `Нельзя удалить класс: к нему привязано ${count} зачислений` };
        }

        const { error } = await admin.from("classes").delete().eq("id", id);
        if (error) return { ok: false, error: error.message };

        revalidatePath("/settings");
        return { ok: true, data: undefined };
    } catch (err) {
        return { ok: false, error: err instanceof Error ? err.message : "Неизвестная ошибка" };
    }
}
