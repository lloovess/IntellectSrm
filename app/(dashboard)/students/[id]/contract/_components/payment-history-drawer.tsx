"use client";

import { useState, useTransition } from "react";
import type { PaymentTransaction } from "@/lib/db/repositories/payment.repo";
import { reversePaymentTransactionAction } from "@/lib/actions/payment.actions";

const SOURCE_LABELS: Record<string, string> = {
    cash: "Наличные",
    kaspi: "Kaspi",
    bank_transfer: "Банк. перевод",
};

const fmt = (n: number) => n.toLocaleString("ru-RU", { maximumFractionDigits: 0 }) + " сом";
const KIND_LABELS: Record<string, string> = {
    payment: "Ручная оплата",
    auto_allocation: "Автозачет",
    advance_credit: "Аванс",
};

interface PaymentHistoryDrawerProps {
    paymentItemId: string;
    studentId: string;
    dueLabel: string;
    onReversed?: (result: {
        newStatus: string;
        newPaidAmount: number;
        contractRemaining: number;
        studentAdvanceBalance: number;
        allocationSummary: Array<{
            paymentItemId: string;
            label: string;
            allocatedAmount: number;
            kind: string;
        }>;
    }) => void;
    canReverse?: boolean;
}

function ReverseDialog({ transactionId, studentId, onCancel, onSuccess }: {
    transactionId: string;
    studentId: string;
    onCancel: () => void;
    onSuccess: (data: {
        newStatus: string;
        newPaidAmount: number;
        contractRemaining: number;
        studentAdvanceBalance: number;
        allocationSummary: Array<{
            paymentItemId: string;
            label: string;
            allocatedAmount: number;
            kind: string;
        }>;
    }) => void;
}) {
    const [reason, setReason] = useState("");
    const [isPending, startTransition] = useTransition();

    async function handleConfirm() {
        if (reason.length < 3) return alert("Укажите причину (минимум 3 символа)");
        startTransition(async () => {
            const res = await reversePaymentTransactionAction({ transactionId, reason, studentId });
            if (res.ok) {
                onSuccess(res.data);
            } else {
                alert(res.error);
            }
        });
    }

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/50 p-4" onClick={onCancel}>
            <div className="w-full max-w-sm rounded-xl bg-white dark:bg-slate-900 shadow-2xl p-6" onClick={(e) => e.stopPropagation()}>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Отмена транзакции (Сторно)</h3>
                <p className="text-sm text-slate-500 mb-4">Данное действие необратимо. Укажите причину отмены операции.</p>
                <textarea
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="Причина отмены..."
                    className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm outline-none focus:border-[#207fdf] dark:focus:border-[#207fdf]/50 mb-4"
                    rows={3}
                />
                <div className="flex gap-2 justify-end">
                    <button onClick={onCancel} disabled={isPending} className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg">Отмена</button>
                    <button onClick={handleConfirm} disabled={isPending} className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg disabled:opacity-50">Сторно</button>
                </div>
            </div>
        </div>
    );
}

export function PaymentHistoryDrawer({ paymentItemId, studentId, dueLabel, onReversed, canReverse = false }: PaymentHistoryDrawerProps) {
    const [open, setOpen] = useState(false);
    const [transactions, setTransactions] = useState<PaymentTransaction[]>([]);
    const [loading, setLoading] = useState(false);
    const [reversingTxId, setReversingTxId] = useState<string | null>(null);
    const [, startTransition] = useTransition();

    async function handleOpen() {
        setOpen(true);
        if (transactions.length > 0) return; // already loaded
        setLoading(true);
        startTransition(async () => {
            try {
                const res = await fetch(`/api/payment-transactions?itemId=${paymentItemId}`);
                if (res.ok) {
                    const data = await res.json();
                    setTransactions(data);
                }
            } finally {
                setLoading(false);
            }
        });
    }

    return (
        <>
            {/* Trigger */}
            <button
                onClick={handleOpen}
                className="flex items-center gap-1.5 text-sm font-medium text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 transition-colors px-2 py-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800"
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                История
            </button>

            {/* Drawer */}
            {open && (
                <div className="fixed inset-0 z-50 flex" onClick={() => setOpen(false)}>
                    <div className="flex-1" />
                    <div
                        className="w-full max-w-sm h-full bg-white dark:bg-slate-900 shadow-2xl border-l border-slate-200 dark:border-slate-700 flex flex-col"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
                            <div>
                                <h2 className="text-lg font-bold text-slate-900 dark:text-white">История оплат</h2>
                                <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">{dueLabel}</p>
                            </div>
                            <button
                                onClick={() => setOpen(false)}
                                className="p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        {/* Content */}
                        <div className="flex-1 overflow-y-auto p-6">
                            {loading ? (
                                <div className="flex items-center justify-center py-16">
                                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#207fdf] border-t-transparent" />
                                </div>
                            ) : transactions.length === 0 ? (
                                <div className="text-center py-16">
                                    <p className="text-slate-400 text-sm">Оплаты не зафиксированы</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {transactions.map((tx) => (
                                        <div
                                            key={tx.id}
                                            className={`relative rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 p-4 ${tx.isReversed ? 'opacity-50 grayscale' : ''}`}
                                        >
                                            <div className="flex items-center justify-between mb-2">
                                                <div className="flex items-center gap-2">
                                                    <span className={`text-lg font-bold ${tx.isReversed ? 'text-slate-500 line-through' : 'text-green-600 dark:text-green-400'}`}>
                                                        {fmt(Number(tx.amount))}
                                                    </span>
                                                    {tx.isReversed && (
                                                        <span className="text-[10px] font-bold uppercase tracking-widest text-red-500 bg-red-100 px-1.5 py-0.5 rounded">
                                                            Отменено
                                                        </span>
                                                    )}
                                                </div>
                                                <span className="text-xs font-medium text-slate-400 tracking-wide uppercase bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 px-2 py-0.5 rounded-full">
                                                    {SOURCE_LABELS[tx.source] || tx.source}
                                                </span>
                                            </div>

                                            <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mt-1">
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 text-slate-300 dark:text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                </svg>
                                                {new Date(tx.paidAt).toLocaleDateString("ru-RU", {
                                                    day: "2-digit", month: "2-digit", year: "numeric",
                                                    hour: "2-digit", minute: "2-digit"
                                                })}
                                            </p>
                                            {(tx.payerName || tx.createdBy || tx.kind) && (
                                                <div className="mt-2 space-y-1 text-xs text-slate-500 dark:text-slate-400">
                                                    {tx.payerName && <p>Плательщик: <span className="font-medium text-slate-700 dark:text-slate-200">{tx.payerName}</span>{tx.payerPhone ? `, ${tx.payerPhone}` : ""}</p>}
                                                    <p>Занес: <span className="font-medium text-slate-700 dark:text-slate-200">{tx.createdBy}</span></p>
                                                    <p>Тип: <span className="font-medium text-slate-700 dark:text-slate-200">{KIND_LABELS[tx.kind] ?? tx.kind}</span></p>
                                                    {tx.allocationGroupId && <p>Группа распределения: <span className="font-mono text-[11px]">{tx.allocationGroupId.slice(0, 8)}</span></p>}
                                                </div>
                                            )}
                                            {tx.notes && !tx.isReversed && (
                                                <p className="mt-2 text-sm text-slate-600 dark:text-slate-300 italic flex gap-1.5">
                                                    <span className="text-slate-300 dark:text-slate-600">&quot;</span>
                                                    {tx.notes}
                                                    <span className="text-slate-300 dark:text-slate-600">&quot;</span>
                                                </p>
                                            )}
                                            {tx.notes && tx.isReversed && (
                                                <p className="mt-2 text-sm text-red-600 dark:text-red-400 font-medium bg-red-50 dark:bg-red-900/10 p-2 rounded-lg border border-red-100 dark:border-red-900/30">
                                                    <span className="block text-xs uppercase tracking-wider mb-0.5 opacity-70">Причина отмены:</span>
                                                    {tx.notes}
                                                </p>
                                            )}

                                            {/* Action Button */}
                                            {canReverse && !tx.isReversed && (
                                                <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-700 flex justify-end">
                                                    <button
                                                        onClick={() => setReversingTxId(tx.id)}
                                                        className="text-xs font-semibold text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 transition-colors"
                                                    >
                                                        Отменить оплату (Сторно)
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
            {reversingTxId && (
                <ReverseDialog
                    transactionId={reversingTxId}
                    studentId={studentId}
                    onCancel={() => setReversingTxId(null)}
                    onSuccess={(data) => {
                        setReversingTxId(null);
                        setTransactions(prev =>
                            prev.map(t => t.id === reversingTxId ? { ...t, isReversed: true, notes: "Отменено пользователем" } : t)
                        );
                        if (onReversed) onReversed(data);
                    }}
                />
            )}
        </>
    );
}
