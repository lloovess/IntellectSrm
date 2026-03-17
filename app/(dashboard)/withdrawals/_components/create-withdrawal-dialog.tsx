"use client";

import { useState, useTransition, useEffect } from "react";
import { createWithdrawalAction } from "@/lib/actions/withdrawal.actions";

interface Enrollment {
    id: string;
    grade: string;
    academicYear: string;
    branchName: string;
    studentName: string;
    studentPhone: string;
}

interface CreateWithdrawalDialogProps {
    enrollments: Enrollment[];
    onClose: () => void;
}

const REASONS = [
    { value: "financial", label: "Финансовые трудности" },
    { value: "relocation", label: "Переезд" },
    { value: "personal", label: "Личные обстоятельства" },
    { value: "health", label: "Здоровье" },
    { value: "academic", label: "Академические трудности" },
    { value: "other", label: "Другое" },
];

export function CreateWithdrawalDialog({ enrollments, onClose }: CreateWithdrawalDialogProps) {
    const [isPending, startTransition] = useTransition();
    const [state, setState] = useState<{ ok?: boolean; error?: string; settlement?: { settlementAmount: number; totalMonths: number; unpaidMonths: number } } | null>(null);
    const [selectedEnrollmentId, setSelectedEnrollmentId] = useState("");
    const [settlementPreview, setSettlementPreview] = useState<{ settlementAmount: number; totalMonths: number; unpaidMonths: number } | null>(null);
    const [loadingPreview, setLoadingPreview] = useState(false);

    const selectedEnrollment = enrollments.find(e => e.id === selectedEnrollmentId);

    // Fetch settlement preview when enrollment changes
    useEffect(() => {
        if (!selectedEnrollmentId) { setSettlementPreview(null); return; }
        setLoadingPreview(true);
        fetch(`/api/withdrawals/settlement?enrollmentId=${selectedEnrollmentId}`)
            .then(r => r.json())
            .then(data => setSettlementPreview(data))
            .catch(() => setSettlementPreview(null))
            .finally(() => setLoadingPreview(false));
    }, [selectedEnrollmentId]);

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        startTransition(async () => {
            const res = await createWithdrawalAction(null, fd);
            setState(res as typeof state);
            if (res.ok) {
                setTimeout(onClose, 2000);
            }
        });
    };

    const fmt = (n: number) => new Intl.NumberFormat("ru-KZ", { style: "currency", currency: "KZT", maximumFractionDigits: 0 }).format(n);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

            {/* Dialog */}
            <div className="relative bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-lg overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-5 border-b border-slate-200 dark:border-slate-800">
                    <h2 className="text-lg font-bold text-slate-900 dark:text-white">Новая заявка на отчисление</h2>
                    <button onClick={onClose} className="p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {state?.ok ? (
                    <div className="p-8 text-center">
                        <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto mb-4">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <h3 className="font-bold text-lg text-slate-900 dark:text-white">Заявка создана</h3>
                        <p className="text-sm text-slate-500 mt-1">Сумма: {fmt(state.settlement?.settlementAmount ?? 0)}</p>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="p-6 space-y-5">
                        {/* Student select */}
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-500 uppercase">Ученик *</label>
                            <select
                                name="enrollmentId"
                                required
                                value={selectedEnrollmentId}
                                onChange={e => setSelectedEnrollmentId(e.target.value)}
                                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#207fdf]/40"
                            >
                                <option value="">Выберите ученика...</option>
                                {enrollments.map(e => (
                                    <option key={e.id} value={e.id}>
                                        {e.studentName} • {e.grade} • {e.branchName}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Settlement preview */}
                        {selectedEnrollment && (
                            <div className="p-4 bg-[#207fdf]/5 border border-[#207fdf]/20 rounded-xl">
                                <p className="text-xs font-bold text-[#207fdf] uppercase mb-2">Предварительный расчёт</p>
                                {loadingPreview ? (
                                    <p className="text-sm text-slate-400 animate-pulse">Рассчитываем...</p>
                                ) : settlementPreview ? (
                                    <div className="space-y-1">
                                        <div className="flex justify-between text-sm">
                                            <span className="text-slate-600 dark:text-slate-400">Неоплаченных месяцев:</span>
                                            <span className="font-semibold">{settlementPreview.unpaidMonths} из {settlementPreview.totalMonths}</span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span className="text-slate-600 dark:text-slate-400">К возврату:</span>
                                            <span className="font-black text-[#207fdf]">{fmt(settlementPreview.settlementAmount)}</span>
                                        </div>
                                    </div>
                                ) : (
                                    <p className="text-xs text-slate-400">Контракт не найден</p>
                                )}
                            </div>
                        )}

                        {/* Reason */}
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-500 uppercase">Причина *</label>
                            <select
                                name="reason"
                                required
                                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#207fdf]/40"
                            >
                                <option value="">Выберите причину...</option>
                                {REASONS.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                            </select>
                        </div>

                        {/* Effective date */}
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-500 uppercase">Дата отчисления *</label>
                            <input
                                type="date"
                                name="effectiveDate"
                                required
                                defaultValue={new Date().toISOString().split("T")[0]}
                                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#207fdf]/40"
                            />
                        </div>

                        {state?.error && (
                            <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-sm text-red-600 dark:text-red-400">
                                {state.error}
                            </div>
                        )}

                        <div className="flex gap-3 pt-2">
                            <button type="button" onClick={onClose} className="flex-1 py-3 text-sm font-semibold border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                                Отмена
                            </button>
                            <button type="submit" disabled={isPending} className="flex-1 py-3 text-sm font-semibold bg-[#207fdf] text-white rounded-xl hover:bg-[#1a6bc4] disabled:opacity-60 transition-colors shadow-sm">
                                {isPending ? "Создаём..." : "Создать заявку"}
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
}
