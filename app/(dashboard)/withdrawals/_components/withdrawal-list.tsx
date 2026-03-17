"use client";

import { useState, useTransition } from "react";
import type { WithdrawalListRow } from "@/lib/db/repositories/withdrawal.repo";
import { approveWithdrawalAction } from "@/lib/actions/withdrawal.actions";

// ── Reason labels ──────────────────────────────────────────────────────────────

export const REASONS_MAP: Record<string, string> = {
    financial: "Финансовые трудности",
    relocation: "Переезд",
    personal: "Личные обстоятельства",
    health: "Здоровье",
    academic: "Академические трудности",
    other: "Другое",
};

// ── Status badge ───────────────────────────────────────────────────────────────

function StatusBadge({ approved }: { approved: boolean }) {
    return approved ? (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block" />
            Согласовано
        </span>
    ) : (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 inline-block" />
            На рассмотрении
        </span>
    );
}

// ── Approval panel inside detail ──────────────────────────────────────────────

function ApproveButton({ caseId, canApprove }: { caseId: string; canApprove: boolean }) {
    const [isPending, startTransition] = useTransition();
    const [done, setDone] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleApprove = () => {
        startTransition(async () => {
            const res = await approveWithdrawalAction(caseId);
            if (res.ok) { setDone(true); }
            else setError(res.error ?? "Ошибка");
        });
    };

    if (done) {
        return (
            <div className="w-full py-3 rounded-lg bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 font-semibold text-sm text-center">
                ✅ Согласовано — зачисление переведено в статус &quot;Отчислен&quot;
            </div>
        );
    }

    return (
        <div className="space-y-2">
            {error && <p className="text-xs text-red-500">{error}</p>}
            {canApprove && (
                <button
                    onClick={handleApprove}
                    disabled={isPending}
                    className="w-full py-3 bg-[#207fdf] text-white font-bold rounded-lg shadow-lg shadow-blue-500/20 hover:opacity-95 disabled:opacity-60 transition-opacity text-sm"
                >
                    {isPending ? "Согласование…" : "Согласовать расчёт и отчислить"}
                </button>
            )}
        </div>
    );
}

// ── Detail Panel ──────────────────────────────────────────────────────────────

function WithdrawalDetail({ row, canApprove }: { row: WithdrawalListRow; canApprove: boolean }) {
    // Reconstruct settlement display from available data
    // settlement_amount is stored; we display it as "balance to student"
    const fmt = (n: number) => new Intl.NumberFormat("ru-KZ", { style: "currency", currency: "KZT", maximumFractionDigits: 0 }).format(n);

    return (
        <div className="h-full overflow-y-auto p-6 space-y-6">
            {/* Student header */}
            <div className="flex items-center gap-4 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                <div className="w-12 h-12 rounded-full bg-[#207fdf]/20 flex items-center justify-center text-[#207fdf] font-bold text-lg">
                    {row.student.fullName.charAt(0)}
                </div>
                <div>
                    <p className="font-bold text-slate-900 dark:text-white">{row.student.fullName}</p>
                    <p className="text-sm text-slate-500">{row.enrollment.grade} • {row.enrollment.branchName}</p>
                    <p className="text-xs text-slate-400">{row.student.phone}</p>
                </div>
            </div>

            {/* Financial Settlement Calculator */}
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
                <div className="flex items-center justify-between px-5 py-4 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
                    <div className="flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-[#207fdf]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 11h.01M12 11h.01M15 11h.01M4 19h16a2 2 0 002-2V7a2 2 0 00-2-2H4a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                        <h4 className="font-bold text-slate-900 dark:text-white">Расчёт компенсации</h4>
                    </div>
                    <StatusBadge approved={row.isApproved} />
                </div>
                <div className="p-5 space-y-3">
                    <div className="flex justify-between py-2 border-b border-slate-100 dark:border-slate-800">
                        <span className="text-sm text-slate-600 dark:text-slate-400">Причина отчисления</span>
                        <span className="text-sm font-semibold text-slate-900 dark:text-white">{REASONS_MAP[row.reason] ?? row.reason}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-slate-100 dark:border-slate-800">
                        <span className="text-sm text-slate-600 dark:text-slate-400">Дата отчисления</span>
                        <span className="text-sm font-semibold text-slate-900 dark:text-white">
                            {row.effectiveDate ? new Date(row.effectiveDate).toLocaleDateString("ru-KZ") : "—"}
                        </span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-slate-100 dark:border-slate-800">
                        <span className="text-sm text-slate-600 dark:text-slate-400">Тип расчёта</span>
                        <span className="text-sm font-semibold">Пропорциональный</span>
                    </div>
                    <div className="flex justify-between items-center pt-3 mt-2">
                        <span className="font-bold text-slate-900 dark:text-white">К возврату</span>
                        <div className="text-right">
                            <span className="text-2xl font-black text-[#207fdf]">{fmt(row.settlementAmount)}</span>
                        </div>
                    </div>
                </div>

                {!row.isApproved && (
                    <div className="px-5 pb-5">
                        <ApproveButton caseId={row.id} canApprove={canApprove} />
                    </div>
                )}

                {row.isApproved && row.approvedBy && (
                    <div className="mx-5 mb-5 p-3 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-xs text-green-700 dark:text-green-400">
                        Согласовано: <strong>{row.approvedBy}</strong><br />
                        {row.approvedAt && new Date(row.approvedAt).toLocaleString("ru-KZ")}
                    </div>
                )}
            </div>
        </div>
    );
}

// ── Main list component ────────────────────────────────────────────────────────

interface WithdrawalListProps {
    list: WithdrawalListRow[];
    canApprove: boolean;
    onNew: () => void;
}

export function WithdrawalList({ list, canApprove, onNew }: WithdrawalListProps) {
    const [selected, setSelected] = useState<WithdrawalListRow | null>(list[0] ?? null);
    const [search, setSearch] = useState("");

    const filtered = list.filter(r =>
        r.student.fullName.toLowerCase().includes(search.toLowerCase()) ||
        (REASONS_MAP[r.reason] ?? r.reason).toLowerCase().includes(search.toLowerCase())
    );

    const pendingCount = list.filter(r => !r.isApproved).length;
    const approvedCount = list.filter(r => r.isApproved).length;
    const totalSettlement = list.reduce((s, r) => s + r.settlementAmount, 0);
    const fmt = (n: number) => new Intl.NumberFormat("ru-KZ", { style: "currency", currency: "KZT", maximumFractionDigits: 0 }).format(n);

    return (
        <div className="space-y-6">
            {/* Stats */}
            <div className="grid grid-cols-3 gap-4">
                {[
                    { label: "На рассмотрении", value: pendingCount, color: "text-amber-600" },
                    { label: "Согласовано", value: approvedCount, color: "text-green-600" },
                    { label: "Сумма компенсаций", value: fmt(totalSettlement), color: "text-[#207fdf]" },
                ].map(s => (
                    <div key={s.label} className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 shadow-sm">
                        <p className={`text-2xl font-black ${s.color}`}>{s.value}</p>
                        <p className="text-xs text-slate-500 mt-1 font-semibold">{s.label}</p>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                {/* List */}
                <div className="lg:col-span-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
                    <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-slate-800">
                        <p className="font-bold text-slate-900 dark:text-white">Заявки на отчисление</p>
                        <div className="flex items-center gap-2">
                            <div className="relative">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                                <input
                                    value={search}
                                    onChange={e => setSearch(e.target.value)}
                                    placeholder="Поиск..."
                                    className="pl-9 pr-3 py-1.5 text-sm border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#207fdf]/40"
                                />
                            </div>
                            {canApprove && (
                                <button
                                    onClick={onNew}
                                    className="flex items-center gap-1.5 px-3 py-1.5 bg-[#207fdf] text-white text-sm font-semibold rounded-lg hover:bg-[#1a6bc4] transition-colors shadow-sm"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                                    </svg>
                                    Новая заявка
                                </button>
                            )}
                        </div>
                    </div>
                    {filtered.length === 0 ? (
                        <div className="p-12 text-center text-slate-400">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto mb-3 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                            </svg>
                            <p className="text-sm font-semibold">Заявок нет</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-slate-100 dark:divide-slate-800">
                            {filtered.map(row => (
                                <button
                                    key={row.id}
                                    onClick={() => setSelected(row)}
                                    className={`w-full text-left px-5 py-4 flex items-center justify-between gap-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors ${selected?.id === row.id ? "bg-[#207fdf]/5 border-l-4 border-[#207fdf]" : ""}`}
                                >
                                    <div className="flex items-center gap-3 min-w-0">
                                        <div className="w-9 h-9 rounded-full bg-[#207fdf]/10 flex items-center justify-center text-[#207fdf] font-bold text-sm flex-shrink-0">
                                            {row.student.fullName.charAt(0)}
                                        </div>
                                        <div className="min-w-0">
                                            <p className="font-semibold text-sm text-slate-900 dark:text-white truncate">{row.student.fullName}</p>
                                            <p className="text-xs text-slate-500 truncate">{row.enrollment.grade} • {REASONS_MAP[row.reason] ?? row.reason}</p>
                                        </div>
                                    </div>
                                    <div className="flex flex-col items-end gap-1 flex-shrink-0">
                                        <StatusBadge approved={row.isApproved} />
                                        <span className="text-xs font-mono text-slate-500">
                                            {new Intl.NumberFormat("ru-KZ", { style: "currency", currency: "KZT", maximumFractionDigits: 0 }).format(row.settlementAmount)}
                                        </span>
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Detail panel */}
                <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm min-h-[400px]">
                    {selected ? (
                        <WithdrawalDetail row={selected} canApprove={canApprove && !selected.isApproved} />
                    ) : (
                        <div className="h-full flex items-center justify-center text-slate-400 p-8 text-center">
                            <div>
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto mb-3 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                </svg>
                                <p className="text-sm">Выберите заявку слева</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
