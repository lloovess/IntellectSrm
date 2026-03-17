import { formatDistanceToNow } from "date-fns";
import { ru } from "date-fns/locale";
import type { RecentTransaction } from "@/lib/services/dashboard.service";

// Avatar helpers
function getInitials(name: string) {
    return name.split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase();
}

const COLORS = [
    "bg-blue-100 text-blue-700",
    "bg-violet-100 text-violet-700",
    "bg-emerald-100 text-emerald-700",
    "bg-amber-100 text-amber-700",
    "bg-rose-100 text-rose-700",
];
function avatarColor(name: string) {
    return COLORS[name.charCodeAt(0) % COLORS.length];
}

const METHOD_LABEL: Record<string, string> = {
    cash: "Наличные",
    card: "Карта",
    bank_transfer: "Перевод",
    kaspi: "Kaspi",
};

interface RecentPaymentsProps {
    payments: RecentTransaction[];
}

export function RecentPayments({ payments }: RecentPaymentsProps) {
    return (
        <div className="col-span-1 md:col-span-2 lg:col-span-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800">
                <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
                    Последние транзакции
                </h3>
            </div>

            {payments.length === 0 ? (
                <div className="flex h-40 flex-col items-center justify-center text-slate-400 gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z" />
                    </svg>
                    <p className="text-sm">Нет транзакций</p>
                </div>
            ) : (
                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                    {payments.map((tx) => (
                        <div
                            key={tx.id}
                            className="flex items-center gap-3 px-6 py-3 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors"
                        >
                            {/* Avatar */}
                            <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${avatarColor(tx.studentName)}`}>
                                {getInitials(tx.studentName)}
                            </div>

                            {/* Info */}
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">
                                    {tx.studentName}
                                </p>
                                <p className="text-xs text-slate-400">
                                    {METHOD_LABEL[tx.paymentMethod] ?? tx.paymentMethod}
                                </p>
                            </div>

                            {/* Amount + time */}
                            <div className="text-right shrink-0">
                                <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                                    +{tx.amount.toLocaleString("ru-RU")} сом
                                </p>
                                <p className="text-[10px] text-slate-400">
                                    {formatDistanceToNow(new Date(tx.paymentDate), { addSuffix: true, locale: ru })}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
