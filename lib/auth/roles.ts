/**
 * Enum всех возможных ролей в системе.
 * Синхронизирован с таблицей user_roles в БД.
 */
export type AppRole =
    | 'admin'
    | 'finance_manager'
    | 'accountant'
    | 'call_center'
    | 'assistant';

/**
 * Права доступа по роли — что разрешено видеть
 */
export const ROLE_PERMISSIONS: Record<AppRole, {
    canViewFinancials: boolean; // revenue, debt
    canViewOverdue: boolean;     // overdue payments
}> = {
    admin: { canViewFinancials: true, canViewOverdue: true },
    finance_manager: { canViewFinancials: true, canViewOverdue: true },
    accountant: { canViewFinancials: true, canViewOverdue: false },
    call_center: { canViewFinancials: false, canViewOverdue: false },
    assistant: { canViewFinancials: false, canViewOverdue: false },
};

export const DEFAULT_ROLE: AppRole = 'assistant';
