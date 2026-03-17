"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { z } from "zod";
import { cookies } from "next/headers";

// Тип состояния формы — заменяет `any`. Включает undefined для useActionState initial state.
export type FormState = { error: string } | null | undefined;

function roleLandingPath(role: string): string {
    if (role === "assistant") return "/assistant";
    if (role === "call_center") return "/call-center";
    if (role === "finance_manager" || role === "accountant") return "/finance";
    return "/";
}

const loginSchema = z.object({
    email: z.string().email({ message: "Неверный формат email" }),
    password: z.string().min(6, { message: "Пароль должен содержать минимум 6 символов" }),
});

export async function loginAction(prevState: FormState, formData: FormData): Promise<FormState> {
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    const valid = loginSchema.safeParse({ email, password });
    if (!valid.success) {
        return { error: valid.error.issues[0].message };
    }

    const supabase = await createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
        return { error: "Неверный email или пароль" };
    }

    const cookieStore = await cookies();
    cookieStore.set("srm_last_activity", Date.now().toString(), { path: "/" });
    cookieStore.set("srm_is_locked", "false", { path: "/" });
    const {
        data: { user: unlockedUser },
    } = await supabase.auth.getUser();
    const userId = unlockedUser?.id;

    let role = "assistant";
    if (userId) {
        const admin = await (await import("@/lib/supabase/server")).createAdminClient();
        const { data } = await admin
            .from("user_roles")
            .select("role")
            .eq("user_id", userId)
            .maybeSingle();
        role = (data?.role as string | undefined) ?? "assistant";
    }

    redirect(roleLandingPath(role));
}

export async function logoutAction(): Promise<void> {
    const supabase = await createClient();
    await supabase.auth.signOut();

    const cookieStore = await cookies();
    cookieStore.delete("srm_last_activity");
    cookieStore.delete("srm_is_locked");

    redirect("/login");
}

export async function lockSessionAction(): Promise<void> {
    const cookieStore = await cookies();
    cookieStore.set("srm_is_locked", "true", { path: "/" });
    redirect("/lock");
}

export async function unlockSessionAction(prevState: FormState, formData: FormData): Promise<FormState> {
    const password = formData.get("password") as string;
    if (!password) {
        return { error: "Введите пароль" };
    }

    const supabase = await createClient();

    const { data: { user: currentUser } } = await supabase.auth.getUser();
    if (!currentUser?.email) {
        return { error: "Сессия не найдена" };
    }

    const { error } = await supabase.auth.signInWithPassword({
        email: currentUser.email,
        password,
    });

    if (error) {
        return { error: "Неверный пароль" };
    }

    const cookieStore = await cookies();
    cookieStore.set("srm_last_activity", Date.now().toString(), { path: "/" });
    cookieStore.set("srm_is_locked", "false", { path: "/" });

    const {
        data: { user: refreshedUser },
    } = await supabase.auth.getUser();
    const userId = refreshedUser?.id;
    let role = "assistant";
    if (userId) {
        const admin = await (await import("@/lib/supabase/server")).createAdminClient();
        const { data } = await admin
            .from("user_roles")
            .select("role")
            .eq("user_id", userId)
            .maybeSingle();
        role = (data?.role as string | undefined) ?? "assistant";
    }

    redirect(roleLandingPath(role));
}
