"use client";

import { useState, useTransition } from "react";
import { recordPaymentAction } from "@/lib/actions/payment.actions";

const SOURCE_LABELS: Record<string, string> = {
    cash: "Наличные",
    kaspi: "Kaspi",
    bank_transfer: "Банк. перевод",
};

const fmt = (n: number) => n.toLocaleString("ru-RU", { maximumFractionDigits: 0 }) + " сом";

interface RecordPaymentDialogProps {
    paymentItemId: string;
    studentId: string;
    dueLabel: string;       // e.g. "Сентябрь"
    amountExpected: number;
    amountPaid: number;
    contractRemaining: number;
    futureRemaining: number;
    onSuccess?: (result: {
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
}

export function RecordPaymentDialog({
    paymentItemId,
    studentId,
    dueLabel,
    amountExpected,
    amountPaid,
    contractRemaining,
    futureRemaining,
    onSuccess,
}: RecordPaymentDialogProps) {
    const [open, setOpen] = useState(false);
    const [isPending, startTransition] = useTransition();
    const [error, setError] = useState<string | null>(null);
    const [payerName, setPayerName] = useState("");
    const [payerPhone, setPayerPhone] = useState("");
    const [note, setNote] = useState("");

    const remaining = amountExpected - amountPaid;
    const [amount, setAmount] = useState(remaining);
    const [source, setSource] = useState<"cash" | "kaspi" | "bank_transfer">("cash");
    const [paidAt, setPaidAt] = useState(new Date().toISOString().substring(0, 10));
    const predictedToCurrent = Math.min(amount, Math.max(0, remaining));
    const predictedToFuture = Math.min(Math.max(0, amount - remaining), Math.max(0, futureRemaining));
    const predictedAdvance = Math.max(0, amount - predictedToCurrent - predictedToFuture);
    const predictedContractRemaining = Math.max(0, contractRemaining - amount);

    function handleOpen() {
        setAmount(remaining);
        setError(null);
        setPayerName("");
        setPayerPhone("");
        setNote("");
        setOpen(true);
    }

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (amount <= 0) { setError("Введите сумму"); return; }
        if (payerName.trim().length < 2) { setError("Укажите плательщика"); return; }
        setError(null);

        startTransition(async () => {
            const result = await recordPaymentAction({
                paymentItemId,
                studentId,
                amount,
                source,
                payerName,
                payerPhone,
                note,
                paidAt: new Date(paidAt).toISOString(),
            });
            if (result.ok) {
                setOpen(false);
                onSuccess?.(result.data);
            } else {
                setError(result.error);
            }
        });
    }

    return (
        <>
            {/* Trigger button */}
            <button
                onClick={handleOpen}
                className="inline-flex items-center gap-1.5 rounded-lg bg-[#207fdf] px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-[#1a6bbf] focus:outline-none focus:ring-2 focus:ring-[#207fdf]/50 focus:ring-offset-2 transition-all"
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
                Оплатить
            </button>

            {open && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                    <div className="w-full max-w-md mx-4 rounded-2xl bg-white dark:bg-slate-900 shadow-2xl border border-slate-200 dark:border-slate-700">
                        {/* Header */}
                        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
                            <div>
                                <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                                    Принять оплату
                                </h2>
                                <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                                    {dueLabel}
                                </p>
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

                        {/* Summary strip */}
                        <div className="grid grid-cols-3 divide-x divide-slate-100 dark:divide-slate-800 bg-slate-50 dark:bg-slate-800/50 px-0">
                            <div className="px-5 py-3 text-center">
                                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">К оплате</p>
                                <p className="mt-0.5 text-base font-bold text-slate-900 dark:text-white">{fmt(amountExpected)}</p>
                            </div>
                            <div className="px-5 py-3 text-center">
                                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Оплачено</p>
                                <p className="mt-0.5 text-base font-bold text-green-600 dark:text-green-400">{fmt(amountPaid)}</p>
                            </div>
                            <div className="px-5 py-3 text-center">
                                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Остаток</p>
                                <p className="mt-0.5 text-base font-bold text-red-600 dark:text-red-400">{fmt(remaining)}</p>
                            </div>
                        </div>

                        {/* Form */}
                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            {error && (
                                <div className="rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 px-4 py-3 text-sm text-red-700 dark:text-red-400">
                                    {error}
                                </div>
                            )}

                            {/* Amount */}
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                                    Сумма оплаты (сом) *
                                </label>
                                <input
                                    type="number"
                                    value={amount}
                                    onChange={(e) => setAmount(Number(e.target.value))}
                                    min={1}
                                    step={100}
                                    required
                                    className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2.5 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#207fdf] transition-all"
                                />
                                {amount > 0 && amount < remaining && (
                                    <p className="mt-1 text-xs text-amber-600 dark:text-amber-400">
                                        Частичная оплата. После: останется {fmt(remaining - amount)}
                                    </p>
                                )}
                                {amount >= remaining && (
                                    <p className="mt-1 text-xs text-green-600 dark:text-green-400">
                                        ✓ Позиция будет закрыта полностью
                                    </p>
                                )}
                            </div>

                            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-xs text-slate-600 dark:border-slate-700 dark:bg-slate-800/50 dark:text-slate-300">
                                <p className="font-semibold text-slate-900 dark:text-white">Прогноз распределения</p>
                                <div className="mt-2 grid grid-cols-2 gap-2">
                                    <p>В текущий платеж: <span className="font-semibold">{fmt(predictedToCurrent)}</span></p>
                                    <p>В следующие месяцы: <span className="font-semibold">{fmt(predictedToFuture)}</span></p>
                                    <p>В аванс: <span className="font-semibold">{fmt(predictedAdvance)}</span></p>
                                    <p>Остаток по договору: <span className="font-semibold">{fmt(predictedContractRemaining)}</span></p>
                                </div>
                            </div>

                            {/* Source */}
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                                    Источник оплаты *
                                </label>
                                <div className="grid grid-cols-3 gap-2">
                                    {(["cash", "kaspi", "bank_transfer"] as const).map((s) => (
                                        <button
                                            key={s}
                                            type="button"
                                            onClick={() => setSource(s)}
                                            className={`py-2 px-3 rounded-lg border text-sm font-medium transition-all ${source === s
                                                ? "border-[#207fdf] bg-[#207fdf]/10 text-[#207fdf] dark:text-blue-400"
                                                : "border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-600"
                                                }`}
                                        >
                                            {SOURCE_LABELS[s]}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                                    Кто оплатил *
                                </label>
                                <input
                                    type="text"
                                    value={payerName}
                                    onChange={(e) => setPayerName(e.target.value)}
                                    placeholder="ФИО плательщика"
                                    required
                                    className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2.5 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#207fdf] transition-all"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                                    Телефон плательщика
                                </label>
                                <input
                                    type="text"
                                    value={payerPhone}
                                    onChange={(e) => setPayerPhone(e.target.value)}
                                    placeholder="+996..."
                                    className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2.5 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#207fdf] transition-all"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                                    Комментарий
                                </label>
                                <textarea
                                    value={note}
                                    onChange={(e) => setNote(e.target.value)}
                                    rows={3}
                                    placeholder="Комментарий к оплате"
                                    className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2.5 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#207fdf] transition-all"
                                />
                            </div>

                            {/* Date */}
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                                    Дата оплаты
                                </label>
                                <input
                                    type="date"
                                    value={paidAt}
                                    onChange={(e) => setPaidAt(e.target.value)}
                                    className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2.5 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#207fdf]"
                                />
                            </div>

                            {/* Actions */}
                            <div className="flex justify-end gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setOpen(false)}
                                    className="px-5 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                                >
                                    Отмена
                                </button>
                                <button
                                    type="submit"
                                    disabled={isPending || amount <= 0}
                                    className="px-5 py-2.5 rounded-lg bg-[#207fdf] text-sm font-semibold text-white hover:bg-[#1a6bc4] disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm shadow-blue-500/20"
                                >
                                    {isPending ? "Сохранение…" : "Записать оплату"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
}
