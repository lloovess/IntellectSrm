"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { generatePaymentScheduleAction, recalculateContractBalanceAction, updatePaymentTermsAndRegenerateAction } from "@/lib/actions/contract.actions";

interface ContractActionsMenuProps {
    contractId: string;
    studentId: string;
}

export function ContractActionsMenu({ contractId, studentId }: ContractActionsMenuProps) {
    const [open, setOpen] = useState(false);
    const [termsOpen, setTermsOpen] = useState(false);
    const [isPending, startTransition] = useTransition();
    const [termsMode, setTermsMode] = useState<"monthly" | "quarterly" | "annual">("monthly");
    const [termsMonths, setTermsMonths] = useState(9);
    const [termsDueDay, setTermsDueDay] = useState(1);
    const [termsError, setTermsError] = useState<string | null>(null);
    const router = useRouter();

    async function handleRecalculate() {
        if (!confirm("Вы уверены, что хотите пересчитать баланс договора?")) return;
        setOpen(false);
        startTransition(async () => {
            const res = await recalculateContractBalanceAction({ contractId, studentId });
            if (res.ok) {
                alert(`Баланс успешно пересчитан. Разница: ${res.data.diff} сом`);
                router.refresh();
            } else {
                alert(`Ошибка: ${res.error}`);
            }
        });
    }

    async function handleGenerateSchedule() {
        if (!confirm("Вы уверены, что хотите перегенерировать график? Текущие неоплаченные плановые платежи будут удалены.")) return;
        setOpen(false);
        startTransition(async () => {
            const res = await generatePaymentScheduleAction({ contractId, studentId, months: 9 });
            if (res.ok) {
                alert("График успешно перегенерирован");
                router.refresh();
            } else {
                alert(`Ошибка: ${res.error}`);
            }
        });
    }

    function openTermsDialog() {
        setTermsError(null);
        setOpen(false);
        setTermsOpen(true);
    }

    function handleApplyTerms() {
        setTermsError(null);
        startTransition(async () => {
            const res = await updatePaymentTermsAndRegenerateAction({
                contractId,
                studentId,
                paymentMode: termsMode,
                months: termsMonths,
                paymentDueDay: termsDueDay,
            });

            if (res.ok) {
                setTermsOpen(false);
                alert("Режим оплаты и график успешно обновлены");
                router.refresh();
            } else {
                setTermsError(res.error);
            }
        });
    }

    return (
        <div className="relative">
            <button
                onClick={() => setOpen((v) => !v)}
                disabled={isPending}
                className="inline-flex items-center gap-2 rounded-lg bg-slate-100 dark:bg-slate-800 px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors disabled:opacity-50"
            >
                Действия по договору
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
            </button>

            {open && (
                <>
                    <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
                    <div className="absolute right-0 z-40 mt-2 w-64 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xl py-1">
                        <button
                            onClick={handleRecalculate}
                            className="w-full text-left px-4 py-2.5 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
                        >
                            Пересчитать баланс
                        </button>
                        <button
                            onClick={handleGenerateSchedule}
                            className="w-full text-left px-4 py-2.5 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
                        >
                            Сгенерировать график (9 мес)
                        </button>
                        <button
                            onClick={openTermsDialog}
                            className="w-full text-left px-4 py-2.5 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
                        >
                            Сменить режим оплаты + перегенерировать
                        </button>
                    </div>
                </>
            )}

            {termsOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 shadow-2xl border border-slate-200 dark:border-slate-700">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
                            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                                Условия оплаты
                            </h3>
                            <button
                                onClick={() => setTermsOpen(false)}
                                className="p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                            >
                                ✕
                            </button>
                        </div>

                        <div className="p-6 space-y-4">
                            {termsError && (
                                <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">
                                    {termsError}
                                </div>
                            )}

                            <div>
                                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                                    Режим оплаты
                                </label>
                                <select
                                    value={termsMode}
                                    onChange={(e) => setTermsMode(e.target.value as "monthly" | "quarterly" | "annual")}
                                    className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2.5 text-sm"
                                >
                                    <option value="monthly">Ежемесячно</option>
                                    <option value="quarterly">Ежеквартально</option>
                                    <option value="annual">Разовый платеж</option>
                                </select>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                                        Месяцев
                                    </label>
                                    <input
                                        type="number"
                                        min={1}
                                        max={12}
                                        value={termsMonths}
                                        onChange={(e) => setTermsMonths(Number(e.target.value))}
                                        className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2.5 text-sm"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                                        День оплаты
                                    </label>
                                    <input
                                        type="number"
                                        min={1}
                                        max={31}
                                        value={termsDueDay}
                                        onChange={(e) => setTermsDueDay(Number(e.target.value))}
                                        className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2.5 text-sm"
                                    />
                                </div>
                            </div>

                            <p className="text-xs text-slate-500">
                                Уже оплаченные/частично оплаченные позиции сохранятся. Будет перегенерирован только оставшийся график.
                            </p>
                        </div>

                        <div className="flex justify-end gap-3 px-6 py-4 border-t border-slate-100 dark:border-slate-800">
                            <button
                                type="button"
                                onClick={() => setTermsOpen(false)}
                                className="px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-sm"
                            >
                                Отмена
                            </button>
                            <button
                                type="button"
                                disabled={isPending}
                                onClick={handleApplyTerms}
                                className="px-4 py-2 rounded-lg bg-[#207fdf] text-white text-sm font-semibold hover:bg-[#1a6bc4] disabled:opacity-50"
                            >
                                {isPending ? "Сохранение..." : "Применить"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
