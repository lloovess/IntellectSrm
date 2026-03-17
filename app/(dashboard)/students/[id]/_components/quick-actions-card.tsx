import Link from "next/link";
import type { Role } from "@/lib/auth/config";
import { checkPermission } from "@/lib/auth/guard";
import { TransferWizardDialog } from "./transfer-wizard-dialog";

interface QuickActionsCardProps {
    studentId: string;
    role: Role;
    hasActiveContract?: boolean;
    enrollmentId?: string | null;
    currentGrade?: string;
    currentBranch?: string;
}

interface Action {
    label: string;
    icon: React.ReactNode;
    color: string;
    href?: string;
}

export function QuickActionsCard({ studentId, role, hasActiveContract = false, enrollmentId, currentGrade, currentBranch }: QuickActionsCardProps) {
    const canReadContracts = checkPermission(role, "contracts.read");
    const canViewPayments = checkPermission(role, "payments.read");
    const canEditStudent = checkPermission(role, "students.write");
    const canReadWithdrawals = checkPermission(role, "withdrawals.read");
    const canTransfer = checkPermission(role, "students.write"); // Assuming write access allows transfer

    const actions: Action[] = [
        // If has active contract → show "Продление" link; else show "Договор"
        hasActiveContract && canReadContracts ? {
            label: "Продление",
            color: "text-violet-600",
            href: `/students/${studentId}/contract?action=renew`,
            icon: (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
            ),
        } : canReadContracts ? {
            label: "Договор",
            color: "text-[#207fdf]",
            href: `/students/${studentId}/contract`,
            icon: (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
            ),
        } : null,
        canViewPayments ? {
            label: "Оплата",
            color: "text-emerald-600",
            href: `/students/${studentId}/contract`,
            icon: (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
            ),
        } : null,
        canEditStudent ? {
            label: "Редактировать",
            color: "text-amber-600",
            href: `/students/${studentId}/edit`,
            icon: (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
            ),
        } : null,
        canReadWithdrawals ? {
            label: "Выбытие",
            color: "text-rose-600",
            href: `/withdrawals/new?studentId=${studentId}`,
            icon: (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
            ),
        } : null,
    ].filter(Boolean) as Action[];

    return (
        <div className="bg-white dark:bg-slate-900 rounded-xl p-6 shadow-sm border border-slate-100 dark:border-slate-800">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">
                Быстрые действия
            </h3>
            <div className="grid grid-cols-2 gap-3">
                {actions.map((action) => {
                    const inner = (
                        <>
                            <div className={`w-10 h-10 rounded-full bg-white dark:bg-slate-600 shadow-sm flex items-center justify-center mb-2 group-hover:scale-110 transition-transform ${action.color}`}>
                                {action.icon}
                            </div>
                            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 text-center">
                                {action.label}
                            </span>
                        </>
                    );

                    return action.href ? (
                        <Link
                            key={action.label}
                            href={action.href}
                            className="flex flex-col items-center justify-center p-4 rounded-xl bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors group"
                        >
                            {inner}
                        </Link>
                    ) : (
                        <button
                            key={action.label}
                            className="flex flex-col items-center justify-center p-4 rounded-xl bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors group"
                        >
                            {inner}
                        </button>
                    );
                })}

                {/* Transfer Action - rendered functionally since it's a dialog trigger rather than a link */}
                {canTransfer && enrollmentId && currentGrade && currentBranch && (
                    <TransferWizardDialog
                        studentId={studentId}
                        enrollmentId={enrollmentId}
                        currentGrade={currentGrade}
                        currentBranch={currentBranch}
                    />
                )}
            </div>
        </div>
    );
}
