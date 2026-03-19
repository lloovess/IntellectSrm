import { requireAuth } from "@/lib/auth";
import { withdrawalService } from "@/lib/services/withdrawal.service";
import { WithdrawalsPageClient } from "./_components/withdrawals-page-client";

export default async function WithdrawalsPage() {
    const user = await requireAuth();
    const canApprove = ["admin", "finance_manager"].includes(user.role);
    const canCreate = ["admin", "finance_manager", "accountant", "assistant"].includes(user.role);

    const [{ list }, enrollments] = await Promise.all([
        withdrawalService.getPage(),
        canCreate ? withdrawalService.getActiveEnrollments() : Promise.resolve([]),
    ]);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <span className="w-1.5 h-6 rounded-full bg-red-400 inline-block" />
                    Отчисления
                </h1>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                    Управление заявками на отчисление и финансовыми расчётами
                </p>
            </div>

            <WithdrawalsPageClient
                list={list}
                canApprove={canApprove}
                enrollments={enrollments}
            />
        </div>
    );
}
