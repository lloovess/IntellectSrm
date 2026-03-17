import type { OverdueItem } from "@/lib/services/dashboard.service";

interface OverdueAlertsProps {
    items: OverdueItem[];
}

export function OverdueAlerts({ items }: OverdueAlertsProps) {
    return (
        <div className="col-span-1 lg:col-span-1 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
                    Просроченные платежи
                </h3>
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                </span>
            </div>

            {items.length === 0 ? (
                <div className="flex h-40 flex-col items-center justify-center text-slate-400 gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-sm">Просрочек нет</p>
                </div>
            ) : (
                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                    {items.map((item) => (
                        <div
                            key={item.id}
                            className="flex items-center justify-between gap-3 px-6 py-3 hover:bg-red-50/50 dark:hover:bg-red-900/10 transition-colors"
                        >
                            <div className="flex items-center gap-2 min-w-0">
                                <div className="h-2 w-2 rounded-full bg-red-500 shrink-0" />
                                <p className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate">
                                    {item.studentName}
                                </p>
                            </div>
                            <div className="text-right shrink-0">
                                <p className="text-sm font-bold text-red-600 dark:text-red-400">
                                    {item.amountDue.toLocaleString("ru-RU")} сом
                                </p>
                                <p className="text-[10px] text-slate-400">
                                    {new Date(item.dueDate).toLocaleDateString("ru-RU", { day: "numeric", month: "short" })}
                                </p>
                            </div>
                        </div>
                    ))}

                    <div className="px-6 py-3">
                        <button className="w-full py-2 text-xs font-semibold text-[#207fdf] hover:bg-[#207fdf]/5 rounded-lg transition-colors">
                            Смотреть все долги →
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
