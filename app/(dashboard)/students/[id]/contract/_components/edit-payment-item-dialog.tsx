"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

interface EditPaymentItemDialogProps {
    paymentItemId: string;
    studentId: string;
    currentLabel: string;
    currentDueDate: string;
    currentAmountExpected: number;
    currentAmountPaid: number;
    onSuccess?: () => void;
}

export function EditPaymentItemDialog({
    paymentItemId,
    studentId,
    currentLabel,
    currentDueDate,
    currentAmountExpected,
    currentAmountPaid,
    onSuccess,
}: EditPaymentItemDialogProps) {
    const [open, setOpen] = useState(false);
    const [isPending, startTransition] = useTransition();
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();

    const [label, setLabel] = useState(currentLabel);
    const [amount, setAmount] = useState(currentAmountExpected);
    const [dueDate, setDueDate] = useState(currentDueDate.substring(0, 10));

    function handleOpen() {
        setLabel(currentLabel);
        setAmount(currentAmountExpected);
        setDueDate(currentDueDate.substring(0, 10));
        setError(null);
        setOpen(true);
    }

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError(null);

        if (amount < currentAmountPaid) {
            setError(`Сумма не может быть меньше уже оплаченной (${currentAmountPaid} сом)`);
            return;
        }

        startTransition(async () => {
            try {
                const res = await fetch(`/api/payment-items/${paymentItemId}`, {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        label,
                        dueDate: new Date(dueDate).toISOString().substring(0, 10),
                        amount,
                    }),
                });

                if (!res.ok) {
                    const data = await res.json();
                    throw new Error(data.error || "Ошибка при сохранении");
                }

                setOpen(false);
                router.refresh();
                onSuccess?.();
            } catch (err: unknown) {
                setError(err instanceof Error ? err.message : "Unknown error");
            }
        });
    }

    return (
        <>
            <button
                onClick={handleOpen}
                className="w-full text-left px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
            >
                Редактировать
            </button>

            {open && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                    <div className="w-full max-w-md mx-4 rounded-2xl bg-white dark:bg-slate-900 shadow-2xl border border-slate-200 dark:border-slate-700">
                        {/* Header */}
                        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
                            <div>
                                <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                                    Изменить платёж
                                </h2>
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

                        {/* Form */}
                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            {error && (
                                <div className="rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 px-4 py-3 text-sm text-red-700 dark:text-red-400">
                                    {error}
                                </div>
                            )}

                            <div>
                                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                                    Название платежа *
                                </label>
                                <input
                                    type="text"
                                    value={label}
                                    onChange={(e) => setLabel(e.target.value)}
                                    required
                                    className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2.5 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#207fdf] transition-all"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                                    Сумма к оплате (сом) *
                                </label>
                                <input
                                    type="number"
                                    value={amount}
                                    onChange={(e) => setAmount(Number(e.target.value))}
                                    min={currentAmountPaid || 1}
                                    required
                                    className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2.5 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#207fdf] transition-all"
                                />
                                {currentAmountPaid > 0 && (
                                    <p className="mt-1 text-xs text-slate-500">
                                        Сумма не может быть меньше оплаченной ({currentAmountPaid} сом).
                                    </p>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                                    Срок оплаты *
                                </label>
                                <input
                                    type="date"
                                    value={dueDate}
                                    onChange={(e) => setDueDate(e.target.value)}
                                    required
                                    className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2.5 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#207fdf]"
                                />
                            </div>

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
                                    disabled={isPending}
                                    className="px-5 py-2.5 rounded-lg bg-[#207fdf] text-sm font-semibold text-white hover:bg-[#1a6bc4] disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm shadow-blue-500/20"
                                >
                                    {isPending ? "Сохранение…" : "Сохранить"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
}
