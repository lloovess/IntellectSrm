import type { CollectionStats } from "@/lib/db/repositories/collection.repo";

const fmtMoney = (n: number) =>
    n.toLocaleString("ru-RU", { maximumFractionDigits: 0 }) + " сом";

interface StatsBarProps {
    stats: CollectionStats;
}

export function StatsBar({ stats }: StatsBarProps) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Total Debt */}
            <div className="relative overflow-hidden rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:bg-slate-900 dark:border-slate-800 group hover:border-red-300 transition-all">
                <div className="absolute right-0 top-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity pointer-events-none">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                </div>
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Общий долг</p>
                <p className="mt-1 text-2xl font-bold text-slate-900 dark:text-white">{fmtMoney(stats.totalDebt)}</p>
                <p className="mt-2 text-xs font-medium text-red-500 flex items-center gap-1">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    </svg>
                    Просроченные платежи
                </p>
            </div>

            {/* Active Tasks */}
            <div className="relative overflow-hidden rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:bg-slate-900 dark:border-slate-800 group hover:border-amber-300 transition-all">
                <div className="absolute right-0 top-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity pointer-events-none">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                </div>
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Активных задач</p>
                <p className="mt-1 text-2xl font-bold text-slate-900 dark:text-white">{stats.activeTasks}</p>
                <p className="mt-2 text-xs font-medium text-amber-500 flex items-center gap-1">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    Требуют обработки
                </p>
            </div>

            {/* Resolved Today */}
            <div className="relative overflow-hidden rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:bg-slate-900 dark:border-slate-800 group hover:border-green-300 transition-all">
                <div className="absolute right-0 top-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity pointer-events-none">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                </div>
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Решено сегодня</p>
                <p className="mt-1 text-2xl font-bold text-slate-900 dark:text-white">{stats.resolvedToday}</p>
                <p className="mt-2 text-xs font-medium text-green-500 flex items-center gap-1">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    В рамках плана
                </p>
            </div>
        </div>
    );
}
