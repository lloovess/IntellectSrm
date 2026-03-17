/**
 * Role & Permission configuration for SRM Intellect.
 * Source: PRD §6.1 / RBAC matrix from lib/rbac.ts (now canonical)
 */

export const ROLES = [
    "assistant",
    "call_center",
    "accountant",
    "finance_manager",
    "admin",
] as const;

export type Role = (typeof ROLES)[number];

export const ROLE_LABELS: Record<Role, string> = {
    assistant: "Ассистент",
    call_center: "Колл-центр",
    accountant: "Бухгалтер",
    finance_manager: "Фин. менеджер",
    admin: "Администратор",
};

export type PermissionKey =
    | "students.read"
    | "students.write"
    | "contracts.read"
    | "contracts.write"
    | "payments.read"
    | "payments.write"
    | "collections.read"
    | "collections.write"
    | "withdrawals.read"
    | "withdrawals.write"
    | "reports.read"
    | "financial_audit.read"
    | "audit.read"
    | "rbac.manage"
    | "branches.read"
    | "branches.write"
    | "classes.read"
    | "classes.write"
    | "import.read"
    | "import.write"
    | "settings.manage";

export const PERMISSIONS: Record<Role, readonly PermissionKey[]> = {
    assistant: [
        "students.read",
        "students.write",
        "contracts.read",
        "contracts.write",
        "branches.read",
        "branches.write",
        "classes.read",
        "classes.write",
        "import.read",
        "import.write",
        "financial_audit.read",
    ],
    call_center: [
        "students.read",
        "contracts.read",
        "payments.read",
        "collections.read",
        "collections.write",
        "withdrawals.read",
    ],
    accountant: [
        "students.read",
        "contracts.read",
        "payments.read",
        "payments.write",
        "withdrawals.read",
        "withdrawals.write",
        "reports.read",
        "financial_audit.read",
        "audit.read",
    ],
    finance_manager: [
        "students.read",
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
    ],
    admin: [
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
        "branches.read",
        "branches.write",
        "classes.read",
        "classes.write",
        "import.read",
        "import.write",
        "settings.manage",
    ],
} as const;

export const ROUTE_PERMISSIONS: Array<{ prefix: string; permission: PermissionKey }> = [
    { prefix: "/students", permission: "students.read" },
    { prefix: "/finance", permission: "payments.read" },
    { prefix: "/collections", permission: "collections.read" },
    { prefix: "/operations/withdrawal", permission: "withdrawals.read" },
    { prefix: "/reports", permission: "financial_audit.read" },
    { prefix: "/settings/audit", permission: "audit.read" },
    { prefix: "/settings/users", permission: "settings.manage" },
    { prefix: "/settings/roles", permission: "rbac.manage" },
    { prefix: "/settings/branches", permission: "branches.read" },
    { prefix: "/settings/classes", permission: "classes.read" },
    { prefix: "/settings/import-export", permission: "import.read" },
];

export function isRole(value: string): value is Role {
    return ROLES.includes(value as Role);
}
