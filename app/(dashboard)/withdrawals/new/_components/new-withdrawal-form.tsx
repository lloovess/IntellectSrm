"use client";

import { useState, useTransition, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createWithdrawalAction } from "@/lib/actions/withdrawal.actions";

const REASONS = [
    { value: "financial", label: "Финансовые трудности" },
    { value: "relocation", label: "Переезд" },
    { value: "personal", label: "Личные обстоятельства" },
    { value: "health", label: "Здоровье" },
    { value: "academic", label: "Академические трудности" },
    { value: "other", label: "Другое" },
];

export function NewWithdrawalForm({ enrollmentId }: { enrollmentId: string }) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const [state, setState] = useState<{ ok?: boolean; error?: string; settlement?: { settlementAmount: number; totalMonths: number; unpaidMonths: number } } | null>(null);
    const [settlementPreview, setSettlementPreview] = useState<{ settlementAmount: number; totalMonths: number; unpaidMonths: number } | null>(null);
    const [loadingPreview, setLoadingPreview] = useState(true);

    useEffect(() => {
        setLoadingPreview(true);
        fetch(`/api/withdrawals/settlement?enrollmentId=${enrollmentId}`)
            .then(r => r.json())
            .then(data => setSettlementPreview(data))
            .catch(() => setSettlementPreview(null))
            .finally(() => setLoadingPreview(false));
    }, [enrollmentId]);

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        startTransition(async () => {
            const res = await createWithdrawalAction(null, fd);
            setState(res as typeof state);
            if (res.ok) {
                setTimeout(() => {
                    router.push("/withdrawals");
                }, 2000);
            }
        });
    };

    const fmt = (n: number) => new Intl.NumberFormat("ru-KZ", { style: "currency", currency: "KZT", maximumFractionDigits: 0 }).format(n);

    if (state?.ok) {
        return (
            <div className="p-10 text-center">
                <div className="w-20 h-20 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto mb-6">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                </div>
                <h3 className="font-bold text-xl text-slate-900 dark:text-white">Заявка успешно создана</h3>
                <p className="text-slate-500 mt-2">
                    Сумма расчета: {fmt(state.settlement?.settlementAmount ?? 0)}
                </p>
                <p className="text-sm text-slate-400 mt-6 animate-pulse">Перенаправление...</p>
            </div>
        );
    }

    return (
        <form onSubmit={handleSubmit} className="p-6 md:p-8 space-y-6">
            <input type="hidden" name="enrollmentId" value={enrollmentId} />

            {/* Settlement preview */}
            <div className="p-5 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800">
                <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-4">Предварительный расчёт взаиморасчета</h4>
                
                {loadingPreview ? (
                    <div className="animate-pulse flex space-x-4">
                        <div className="flex-1 space-y-3 py-1">
                            <div className="h-2 bg-slate-200 rounded"></div>
                            <div className="h-2 bg-slate-200 rounded w-5/6"></div>
                        </div>
                    </div>
                ) : settlementPreview ? (
                    <div className="space-y-3">
                        <div className="flex justify-between text-sm py-2 border-b border-slate-200 dark:border-slate-700/50">
                            <span className="text-slate-500 dark:text-slate-400">Неоплаченных месяцев в графике:</span>
                            <span className="font-semibold text-slate-900 dark:text-white">
                                {settlementPreview.unpaidMonths} из {settlementPreview.totalMonths}
                            </span>
                        </div>
                        <div className="flex justify-between text-base py-2">
                            <span className="text-slate-600 dark:text-slate-300 font-medium">Сумма:</span>
                            <span className="font-black text-rose-600">{fmt(settlementPreview.settlementAmount)}</span>
                        </div>
                        <p className="text-xs text-slate-400 mt-2">
                            * Сумма высчитывается пропорционально остатку неоплаченных месяцев к базовой стоимости договора.
                        </p>
                    </div>
                ) : (
                    <p className="text-sm text-slate-400">Контракт не найден или расчёт недоступен.</p>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Reason */}
                <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase">Причина отчисления *</label>
                    <select
                        name="reason"
                        required
                        className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm px-4 py-3.5 focus:outline-none focus:ring-2 focus:ring-rose-500/30 transition-shadow"
                    >
                        <option value="">Выберите причину...</option>
                        {REASONS.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                    </select>
                </div>

                {/* Effective date */}
                <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase">Дата отчисления *</label>
                    <input
                        type="date"
                        name="effectiveDate"
                        required
                        defaultValue={new Date().toISOString().split("T")[0]}
                        className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm px-4 py-3.5 focus:outline-none focus:ring-2 focus:ring-rose-500/30 transition-shadow"
                    />
                </div>
            </div>

            {state?.error && (
                <div className="p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-sm text-red-600 dark:text-red-400 font-medium">
                    {state.error}
                </div>
            )}

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button 
                    type="button" 
                    onClick={() => router.back()} 
                    className="px-6 py-3 text-sm font-semibold border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                >
                    Отмена
                </button>
                <button 
                    type="submit" 
                    disabled={isPending} 
                    className="px-8 py-3 text-sm font-semibold bg-rose-600 text-white rounded-xl hover:bg-rose-700 disabled:opacity-60 transition-colors shadow-sm shadow-rose-600/20"
                >
                    {isPending ? "Создаём..." : "Оформить выбытие"}
                </button>
            </div>
        </form>
    );
}
