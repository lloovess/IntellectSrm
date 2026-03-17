/**
 * @deprecated — Use `@/lib/auth` instead.
 * This file is kept as a backward-compatibility shim for prototype pages
 * until they are rewritten in Phase 2.
 */
export {
  type Role,
  type PermissionKey,
  ROLE_LABELS as roleLabels,
  PERMISSIONS as rbacMatrix,
  ROLES,
} from "@/lib/auth/config";

// Re-export permissions array for the roles page
import { type PermissionKey } from "@/lib/auth/config";
export const permissions: PermissionKey[] = [
  "students.read",
  "students.write",
  "contracts.read",
  "contracts.write",
  "payments.read",
  "payments.write",
  "collections.read",
  "collections.write",
  "withdrawals.read",
  "withdrawals.write",
  "reports.read",
  "financial_audit.read",
  "audit.read",
  "rbac.manage",
];
