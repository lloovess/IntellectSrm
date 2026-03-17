import type { StudentProfile } from "@/lib/services/student-profile.service";

const PAYMENT_STATUS_STYLE: Record<string, { label: string; classes: string }> = {
    planned: { label: "Запланирован", classes: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400" },
    partially_paid: { label: "Частично", classes: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" },
    paid: { label: "Оплачен", classes: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" },
    overdue: { label: "Просрочен", classes: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" },
};

interface FinancialOverviewCardProps {
    profile: StudentProfile;
}

export function FinancialOverviewCard({ profile }: FinancialOverviewCardProps) {
    const { contract, paymentItems } = profile;

    // Считаем баланс
    const totalExpected = paymentItems.reduce((s, p) => s + p.amountExpected, 0);
    const totalPaid = paymentItems.reduce((s, p) => s + p.amountPaid, 0);
    const balance = totalExpected - totalPaid;

    // Следующий неоплаченный
    const nextPayment = paymentItems.find((p) =>
        p.status === "overdue" || p.status === "partially_paid" || p.status === "planned"
    );

    const fmt = (n: number) => n.toLocaleString("ru-RU") + " сом";

    return (
        <div className="bg-white dark:bg-slate-900 rounded-xl p-6 shadow-sm border border-slate-100 dark:border-slate-800 relative overflow-hidden">
            {/* Decorative blob */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-[#207fdf]/5 rounded-full -mr-10 -mt-10 pointer-events-none" />

            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6 relative z-10">
                Финансовый обзор
            </h3>

            {!contract ? (
                <div className="flex flex-col items-center justify-center py-6 text-slate-400 relative z-10">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 mb-2 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <p className="text-sm">Активный договор не найден</p>
                </div>
            ) : (
                <div className="relative z-10 space-y-4">
                    {/* Balance */}
                    <div>
                        <p className="text-sm text-slate-500 mb-1">Текущий долг</p>
                        <div className="flex items-baseline gap-2">
                            <p className="text-4xl font-black text-slate-900 dark:text-white tracking-tight">
                                {fmt(balance)}
                            </p>
                            {balance <= 0 && (
                                <span className="text-xs font-bold text-green-600 bg-green-100 dark:bg-green-900/30 dark:text-green-400 px-2 py-1 rounded-full">
                                    Оплачен
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Next payment */}
                    {nextPayment && (
                        <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4">
                            <div className="flex justify-between items-center mb-1">
                                <span className="text-xs text-slate-500 uppercase font-semibold">
                                    Следующий платёж
                                </span>
                                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${PAYMENT_STATUS_STYLE[nextPayment.status]?.classes}`}>
                                    {PAYMENT_STATUS_STYLE[nextPayment.status]?.label}
                                </span>
                            </div>
                            <p className="text-slate-900 dark:text-white font-bold">
                                {fmt(nextPayment.amountExpected - nextPayment.amountPaid)}
                            </p>
                            <p className="text-xs text-slate-500">
                                {new Date(nextPayment.dueDate).toLocaleDateString("ru-RU", { day: "numeric", month: "long", year: "numeric" })}
                                {nextPayment.label ? ` · ${nextPayment.label}` : ""}
                            </p>
                        </div>
                    )}

                    {/* Contract info */}
                    <div className="text-xs text-slate-400 border-t border-slate-100 dark:border-slate-800 pt-3">
                        <p>Договор: <span className="text-slate-600 dark:text-slate-300 font-medium">{contract.contractNumber}</span></p>
                        <p className="mt-0.5">Сумма: <span className="text-slate-600 dark:text-slate-300 font-medium">{fmt(contract.totalAmount)}</span></p>
                    </div>
                </div>
            )}
        </div>
    );
}
