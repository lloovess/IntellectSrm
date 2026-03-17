interface PaymentLogicCardProps {
    totalPaid: number;
    totalExpected: number;
    totalRemaining: number;
    percentPaid: number;
    overdueCount: number;
    nextDueDate?: string | null;
    advanceBalance?: number;
    advanceLastEntryAt?: string | null;
    advanceLastReason?: string | null;
}

const fmt = (n: number) =>
    n.toLocaleString("ru-RU", { maximumFractionDigits: 0 }) + " ₸";

export function PaymentLogicCard({
    totalPaid,
    totalExpected,
    totalRemaining,
    percentPaid,
    overdueCount,
    nextDueDate,
    advanceBalance = 0,
    advanceLastEntryAt = null,
    advanceLastReason = null,
}: PaymentLogicCardProps) {
    const isFullyPaid = percentPaid >= 100;

    return (
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-white to-slate-50 p-6 shadow-sm ring-1 ring-slate-200 dark:from-slate-900 dark:to-slate-800/80 dark:ring-slate-800 flex flex-col lg:col-span-1">
            {/* Subtle glow effect behind */}
            <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-[#207fdf]/10 blur-3xl pointer-events-none" />

            <div className="flex items-center justify-between mb-6">
                <h4 className="flex items-center gap-2 text-sm font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-[#207fdf]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Баланс
                </h4>
                {isFullyPaid && (
                    <span className="inline-flex items-center rounded-md bg-green-50 px-2 py-1 text-xs font-medium text-green-700 ring-1 ring-inset ring-green-600/20 dark:bg-green-500/10 dark:text-green-400 dark:ring-green-500/20">
                        Оплачено
                    </span>
                )}
            </div>

            <div className="flex flex-col gap-1 mb-8">
                <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Оплачено</span>
                <div className="flex items-baseline gap-2">
                    <span className="text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                        {fmt(totalPaid)}
                    </span>
                    <span className="text-sm font-medium text-slate-400 dark:text-slate-500">
                        из {fmt(totalExpected)}
                    </span>
                </div>
                <div className="mt-2 text-sm font-semibold text-slate-600 dark:text-slate-300">
                    Остаток: {fmt(totalRemaining)}
                </div>
            </div>

            <ul className="space-y-4 mb-6 flex-1">
                {overdueCount > 0 && (
                    <li className="flex items-center justify-between rounded-xl bg-red-50 p-3 ring-1 ring-inset ring-red-100 dark:bg-red-900/10 dark:ring-red-900/30">
                        <div className="flex items-center gap-3">
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-red-600 dark:text-red-400" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                </svg>
                            </div>
                            <span className="text-sm font-medium text-red-800 dark:text-red-400">Просрочено платежей</span>
                        </div>
                        <span className="text-sm font-bold text-red-600 dark:text-red-400">{overdueCount}</span>
                    </li>
                )}
                {nextDueDate && (
                    <li className="flex items-center justify-between rounded-xl bg-slate-50 p-3 ring-1 ring-inset ring-slate-200/50 dark:bg-slate-800/50 dark:ring-slate-700/50">
                        <div className="flex items-center gap-3">
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-200/50 dark:bg-slate-700/50">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-slate-600 dark:text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                            </div>
                            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Платёж</span>
                        </div>
                        <span className="text-sm font-semibold text-slate-900 dark:text-white">
                            {new Date(nextDueDate).toLocaleDateString("ru-RU", { day: "numeric", month: "short" })}
                        </span>
                    </li>
                )}
                <li className="rounded-xl bg-emerald-50 p-3 ring-1 ring-inset ring-emerald-100 dark:bg-emerald-900/10 dark:ring-emerald-900/30">
                    <div className="flex items-center justify-between gap-3">
                        <span className="text-sm font-medium text-emerald-800 dark:text-emerald-300">Аванс ученика</span>
                        <span className="text-sm font-bold text-emerald-700 dark:text-emerald-300">{fmt(advanceBalance)}</span>
                    </div>
                    {advanceLastEntryAt && (
                        <p className="mt-2 text-xs text-emerald-700/80 dark:text-emerald-300/80">
                            Последнее движение: {new Date(advanceLastEntryAt).toLocaleDateString("ru-RU", { day: "2-digit", month: "2-digit", year: "numeric" })}
                            {advanceLastReason ? `, ${advanceLastReason}` : ""}
                        </p>
                    )}
                </li>
            </ul>

            <div className="mt-auto">
                <div className="flex justify-between items-end mb-2">
                    <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Прогресс</span>
                    <span className="text-sm font-bold text-slate-900 dark:text-white">{percentPaid}%</span>
                </div>
                <div className="h-3 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden shadow-inner">
                    <div
                        className="h-full rounded-full bg-gradient-to-r from-[#207fdf] to-[#409fff] transition-all duration-700 ease-out"
                        style={{ width: `${Math.min(100, percentPaid)}%` }}
                    />
                </div>
            </div>
        </div>
    );
}
