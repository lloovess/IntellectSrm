/**
 * @deprecated — Use `@/lib/auth` for session and `@/lib/supabase/server` for clients.
 * This file is kept as a backward-compatibility shim for prototype pages.
 */
import { isRole, type Role } from "@/lib/auth/config";
import { getCurrentUser } from "@/lib/auth/session";

export const ROLE_COOKIE_NAME = "srm_role";
export const ACCESS_TOKEN_COOKIE_NAME = "srm_access_token";
export const REFRESH_TOKEN_COOKIE_NAME = "srm_refresh_token";
export const USER_EMAIL_COOKIE_NAME = "srm_user_email";

export { isRole };

/**
 * @deprecated Use getCurrentUser() from @/lib/auth
 */
export async function getCurrentRoleFromCookies(): Promise<Role> {
  const user = await getCurrentUser();
  return user?.role ?? "assistant";
}

export function roleToWorkspace(
  role: Role
): "assistant" | "call_center" | "finance_manager" | "admin" {
  if (role === "call_center") return "call_center";
  if (role === "finance_manager" || role === "accountant")
    return "finance_manager";
  if (role === "admin") return "admin";
  return "assistant";
}

export type CurrentSession = {
  isAuthenticated: boolean;
  role: Role;
  email: string | null;
};

/**
 * @deprecated Use requireAuth() / getCurrentUser() from @/lib/auth
 */
export async function getCurrentSessionFromCookies(): Promise<CurrentSession> {
  const user = await getCurrentUser();
  return {
    isAuthenticated: !!user,
    role: user?.role ?? "assistant",
    email: user?.email ?? null,
  };
}
