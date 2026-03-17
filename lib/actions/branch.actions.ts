"use server";

import { revalidatePath } from "next/cache";
import { requireAuth } from "@/lib/auth/session";
import { checkPermission } from "@/lib/auth/guard";
import { createAdminClient } from "@/lib/supabase/server";

export type ActionResult<T = void> =
    | { ok: true; data: T }
    | { ok: false; error: string };

export async function createBranchAction(name: string): Promise<ActionResult<{ id: string; name: string }>> {
    try {
        const { role } = await requireAuth();
        if (!checkPermission(role, "branches.write")) {
            return { ok: false, error: "Нет прав на создание филиала" };
        }
        if (!name.trim()) return { ok: false, error: "Введите название филиала" };

        const admin = await createAdminClient();
        const { data, error } = await admin
            .from("branches")
            .insert({ name: name.trim() })
            .select("id, name")
            .single();

        if (error) return { ok: false, error: error.message };
        revalidatePath("/settings/branches");
        return { ok: true, data: data as { id: string; name: string } };
    } catch (err) {
        return { ok: false, error: err instanceof Error ? err.message : "Неизвестная ошибка" };
    }
}

export async function updateBranchAction(id: string, name: string): Promise<ActionResult> {
    try {
        const { role } = await requireAuth();
        if (!checkPermission(role, "branches.write")) {
            return { ok: false, error: "Нет прав на изменение филиала" };
        }
        if (!name.trim()) return { ok: false, error: "Название не может быть пустым" };

        const admin = await createAdminClient();
        const { error } = await admin
            .from("branches")
            .update({ name: name.trim() })
            .eq("id", id);

        if (error) return { ok: false, error: error.message };
        revalidatePath("/settings/branches");
        return { ok: true, data: undefined };
    } catch (err) {
        return { ok: false, error: err instanceof Error ? err.message : "Неизвестная ошибка" };
    }
}

export async function deleteBranchAction(id: string): Promise<ActionResult> {
    try {
        const { role } = await requireAuth();
        if (!checkPermission(role, "branches.write")) {
            return { ok: false, error: "Нет прав на удаление филиала" };
        }

        const admin = await createAdminClient();

        // Check if branch is in use before deleting
        const { count } = await admin
            .from("enrollments")
            .select("id", { count: "exact", head: true })
            .eq("branch_id", id);

        if ((count ?? 0) > 0) {
            return { ok: false, error: `Нельзя удалить филиал: к нему привязано ${count} зачислений` };
        }

        const { error } = await admin.from("branches").delete().eq("id", id);
        if (error) return { ok: false, error: error.message };

        revalidatePath("/settings/branches");
        return { ok: true, data: undefined };
    } catch (err) {
        return { ok: false, error: err instanceof Error ? err.message : "Неизвестная ошибка" };
    }
}
