import { cache } from 'react';
import { createAdminClient, createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { isRole, type Role } from './config';

export type CurrentUser = {
    id: string;
    email: string;
    role: Role;
};

/**
 * Получает текущего пользователя из Supabase сессии и его роль из таблицы user_roles.
 * Обёрнут в React.cache() — в рамках одного запроса вызывается только один раз,
 * даже если getCurrentUser() вызывается из нескольких мест (middleware, page, layout).
 */
export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
    const supabase = await createClient();
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) {
        return null;
    }

    // 1. Пытаемся взять роль из JWT (app_metadata), которая туда попадает через Postgres Trigger
    let rawRole = user.app_metadata?.role as string | undefined;

    // 2. Фолбэк (для старых сессий, пока токен не обновился)
    if (!rawRole) {
        try {
            const admin = await createAdminClient();
            const { data: roleRow } = await admin
                .from('user_roles')
                .select('role')
                .eq('user_id', user.id)
                .single();
            rawRole = roleRow?.role;
        } catch (e) {
            console.warn("Failed to fetch fallback role for user", user.id);
        }
    }

    const role: Role = rawRole && isRole(rawRole) ? rawRole : 'assistant';

    return {
        id: user.id,
        email: user.email ?? '',
        role,
    };
});

/**
 * Получает текущую роль пользователя.
 * @returns Role или 'assistant' по умолчанию
 */
export async function getCurrentRole(): Promise<Role> {
    const user = await getCurrentUser();
    return user?.role ?? 'assistant';
}

/**
 * Требует авторизации — редиректит на /login если не авторизован.
 * Используется в Server Components и Server Actions.
 */
export async function requireAuth(): Promise<CurrentUser> {
    const user = await getCurrentUser();
    if (!user) {
        redirect('/login');
    }
    return user;
}

/**
 * Псевдоним для getCurrentUser() — для совместимости с page.tsx.
 */
export const getCurrentUserWithRole = getCurrentUser;
