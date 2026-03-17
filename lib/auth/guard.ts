import { redirect } from "next/navigation";
import { type Role, type PermissionKey, PERMISSIONS } from "./config";
import { requireAuth } from "./session";

/**
 * Check if a role has a specific permission.
 */
export function checkPermission(role: Role, permission: PermissionKey): boolean {
    return (PERMISSIONS[role] as readonly string[]).includes(permission);
}

/**
 * Check if a role has ALL of the specified permissions.
 */
export function checkPermissions(
    role: Role,
    permissions: PermissionKey[]
): boolean {
    return permissions.every((p) => checkPermission(role, p));
}

/**
 * Require a specific permission in a Server Component / Server Action.
 * Redirects to / if the user lacks the permission.
 */
export async function requirePermission(
    permission: PermissionKey
): Promise<void> {
    const user = await requireAuth();
    if (!checkPermission(user.role, permission)) {
        redirect("/");
    }
}

/**
 * Require one of the specified roles in a Server Component / Server Action.
 */
export async function requireRole(roles: Role[]): Promise<void> {
    const user = await requireAuth();
    if (!roles.includes(user.role)) {
        redirect("/");
    }
}
