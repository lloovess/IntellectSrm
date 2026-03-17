"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { PaymentItemDetail } from "@/lib/db/repositories/contract.repo";
import { RecordPaymentDialog } from "./record-payment-dialog";
import { PaymentHistoryDrawer } from "./payment-history-drawer";
import { AddPaymentItemDialog } from "./add-payment-item-dialog";
import { EditPaymentItemDialog } from "./edit-payment-item-dialog";

const STATUS_CONFIG: Record<string, { label: string; classes: string }> = {
    paid: { label: "Оплачено", classes: "bg-green-50 text-green-700 ring-1 ring-inset ring-green-600/20 dark:bg-green-900/30 dark:text-green-400" },
    overdue: { label: "Просрочено", classes: "bg-red-50 text-red-700 ring-1 ring-inset ring-red-600/20 dark:bg-red-900/30 dark:text-red-400" },
    partially_paid: { label: "Частично", classes: "bg-yellow-50 text-yellow-800 ring-1 ring-inset ring-yellow-600/20 dark:bg-yellow-900/30 dark:text-yellow-500" },
    planned: { label: "Ожидается", classes: "bg-slate-100 text-slate-600 ring-1 ring-inset ring-slate-500/10 dark:bg-slate-800 dark:text-slate-400" },
};

const fmt = (n: number) =>
    n.toLocaleString("ru-RU", { maximumFractionDigits: 0 }) + " сом";

interface PaymentScheduleTableProps {
    items: PaymentItemDetail[];
    studentId: string;
    contractId: string;
    canEdit?: boolean;
    canRecord?: boolean;
}

export function PaymentScheduleTable({ items, studentId, contractId, canEdit = false, canRecord = false }: PaymentScheduleTableProps) {
    // Local optimistic state: override statuses/amounts after payment
    const [overrides, setOverrides] = useState<Record<string, { status: string; amountPaid: number }>>({});
    const [lastPaymentMessage, setLastPaymentMessage] = useState<string | null>(null);

    const contractRemaining = items.reduce((sum, item) => {
        const override = overrides[item.id];
        const paidAmount = override?.amountPaid ?? item.amountPaid;
        return sum + Math.max(0, item.amountExpected - paidAmount);
    }, 0);

    function handlePaymentSuccess(itemId: string, result: {
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
    }) {
        const { newStatus, newPaidAmount } = result;
        setOverrides((prev) => ({ ...prev, [itemId]: { status: newStatus, amountPaid: newPaidAmount } }));
        const summary = result.allocationSummary
            .map((item) => `${item.label}: ${fmt(item.allocatedAmount)}`)
            .join(", ");
        setLastPaymentMessage(`Оплата записана. Распределение: ${summary}. Остаток по договору: ${fmt(result.contractRemaining)}. Аванс: ${fmt(result.studentAdvanceBalance)}.`);
    }

    if (items.length === 0) {
        return (
            <div className="rounded-xl bg-white shadow-sm dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-12 text-center">
                <p className="text-slate-400 text-sm">Платёжный план пуст</p>
            </div>
        );
    }

    // Action dropdown and buttons per row
    function RowActions({ item }: { item: PaymentItemDetail }) {
        const [open, setOpen] = useState(false);
        const [isPending, startTransition] = useTransition();
        const router = useRouter();

        const override = overrides[item.id];
        const currentPaid = override?.amountPaid ?? item.amountPaid;
        const currentStatus = override?.status ?? item.status;
        const isPaid = currentStatus === "paid";
        const currentIndex = items.findIndex((candidate) => candidate.id === item.id);
        const futureRemaining = items
            .slice(currentIndex + 1)
            .reduce((sum, candidate) => {
                const candidateOverride = overrides[candidate.id];
                const candidatePaid = candidateOverride?.amountPaid ?? candidate.amountPaid;
                return sum + Math.max(0, candidate.amountExpected - candidatePaid);
            }, 0);

        async function handleDelete() {
            if (!confirm("Вы действительно хотите удалить этот платеж?")) return;
            startTransition(async () => {
                try {
                    const res = await fetch(`/api/payment-items/${item.id}`, { method: "DELETE" });
                    if (!res.ok) throw new Error("Ошибка при удалении");
                    router.refresh();
                } catch (err) {
                    alert((err as Error).message);
                }
            });
        }

        return (
            <div className="flex items-center justify-end gap-2 relative">
                {canRecord && !isPaid && (
                    <RecordPaymentDialog
                        paymentItemId={item.id}
                        studentId={studentId}
                        dueLabel={item.label}
                        amountExpected={item.amountExpected}
                        amountPaid={currentPaid}
                        contractRemaining={contractRemaining}
                        futureRemaining={futureRemaining}
                        onSuccess={(result) => {
                            handlePaymentSuccess(item.id, result);
                        }}
                    />
                )}

                <div className="relative">
                    <button
                        onClick={() => setOpen((v) => !v)}
                        className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                        </svg>
                    </button>

                    {open && (
                        <>
                            {/* Backdrop */}
                            <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
                            <div className="absolute right-0 z-40 mt-1 w-52 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xl p-1">
                                {canEdit && (
                                    <>
                                        <div onClick={() => setOpen(false)}>
                                            <EditPaymentItemDialog
                                                paymentItemId={item.id}
                                                studentId={studentId}
                                                currentLabel={item.label}
                                                currentDueDate={item.dueDate}
                                                currentAmountExpected={item.amountExpected}
                                                currentAmountPaid={currentPaid}
                                            />
                                        </div>
                                        <div className="border-t border-slate-100 dark:border-slate-700 my-1" />
                                    </>
                                )}

                                <div onClick={() => setOpen(false)}>
                                    <PaymentHistoryDrawer
                                        paymentItemId={item.id}
                                        studentId={studentId}
                                        dueLabel={item.label}
                                        onReversed={(result) => {
                                            handlePaymentSuccess(item.id, result);
                                        }}
                                        canReverse={canRecord}
                                    />
                                </div>

                                {canEdit && currentPaid === 0 && (
                                    <>
                                        <div className="border-t border-slate-100 dark:border-slate-700 my-1" />
                                        <button
                                            onClick={() => { setOpen(false); handleDelete(); }}
                                            disabled={isPending}
                                            className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors disabled:opacity-50"
                                        >
                                            Удалить
                                        </button>
                                    </>
                                )}
                            </div>
                        </>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className="rounded-xl bg-white shadow-sm dark:bg-slate-900 border border-slate-100 dark:border-slate-800 overflow-hidden">
            {lastPaymentMessage && (
                <div className="border-b border-emerald-200 bg-emerald-50 px-6 py-3 text-sm text-emerald-800 dark:border-emerald-900/40 dark:bg-emerald-900/10 dark:text-emerald-200">
                    {lastPaymentMessage}
                </div>
            )}
            {/* Table header bar */}
            <div className="border-b border-slate-100 bg-white px-6 py-4 dark:border-slate-800 dark:bg-slate-900 flex justify-between items-center">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">График платежей</h3>
                <div className="flex gap-2 items-center">
                    {canEdit && (
                        <AddPaymentItemDialog contractId={contractId} studentId={studentId} />
                    )}
                    <button className="p-1.5 text-slate-400 hover:text-[#207fdf] transition-colors rounded-lg hover:bg-[#207fdf]/10" title="Фильтр">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                        </svg>
                    </button>
                    <button className="p-1.5 text-slate-400 hover:text-[#207fdf] transition-colors rounded-lg hover:bg-[#207fdf]/10" title="Скачать">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                    </button>
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50/80 text-slate-500 dark:bg-slate-800/80 dark:text-slate-400 backdrop-blur-sm">
                        <tr>
                            <th className="px-6 py-4 font-semibold text-xs tracking-wider">Назначение</th>
                            <th className="px-6 py-4 font-semibold text-xs tracking-wider">Срок оплаты</th>
                            <th className="px-6 py-4 font-semibold text-xs tracking-wider text-right">Сумма</th>
                            <th className="px-6 py-4 font-semibold text-xs tracking-wider text-right">Оплачено</th>
                            <th className="px-6 py-4 font-semibold text-xs tracking-wider text-right">Остаток</th>
                            <th className="px-6 py-4 font-semibold text-xs tracking-wider text-center">Статус</th>
                            {(canRecord || canEdit) && (
                                <th className="px-6 py-4 font-semibold text-xs tracking-wider text-right">Действия</th>
                            )}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {items.map((item, idx) => {
                            const override = overrides[item.id];
                            const status = override?.status ?? item.status;
                            const amountPaid = override?.amountPaid ?? item.amountPaid;
                            const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.planned;
                            const remaining = item.amountExpected - amountPaid;
                            const isOverdue = status === "overdue";
                            const isPaid = status === "paid";

                            return (
                                <tr
                                    key={item.id}
                                    className="group transition-colors bg-white dark:bg-slate-900 hover:bg-slate-50/80 dark:hover:bg-slate-800/50"
                                >
                                    <td className="whitespace-nowrap px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="flex shrink-0 h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400 font-semibold text-xs">
                                                {idx + 1}
                                            </div>
                                            <span className="font-semibold text-slate-900 dark:text-white">{item.label}</span>
                                        </div>
                                    </td>
                                    <td className={`whitespace-nowrap px-6 py-4 font-medium ${isOverdue ? "text-red-600 dark:text-red-400" : "text-slate-500 dark:text-slate-400"}`}>
                                        {new Date(item.dueDate).toLocaleDateString("ru-RU", {
                                            day: "2-digit", month: "2-digit", year: "numeric",
                                        })}
                                    </td>
                                    <td className="whitespace-nowrap px-6 py-4 text-right">
                                        <span className="font-bold text-slate-900 dark:text-white">{fmt(item.amountExpected)}</span>
                                    </td>
                                    <td className="whitespace-nowrap px-6 py-4 text-right">
                                        <span className={`font-semibold ${amountPaid > 0 ? "text-green-600 dark:text-green-400" : "text-slate-400"}`}>
                                            {fmt(amountPaid)}
                                        </span>
                                    </td>
                                    <td className="whitespace-nowrap px-6 py-4 text-right">
                                        <span className={`font-bold ${isPaid ? "text-slate-300 dark:text-slate-600" : isOverdue ? "text-red-600 dark:text-red-400" : "text-[#207fdf]"}`}>
                                            {isPaid ? "0 ₸" : fmt(remaining)}
                                        </span>
                                    </td>
                                    <td className="whitespace-nowrap px-6 py-4 text-center">
                                        <div className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${cfg.classes}`}>
                                            {isPaid && (
                                                <svg className="w-3.5 h-3.5" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M10 3L4.5 8.5L2 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                                            )}
                                            {cfg.label}
                                        </div>
                                    </td>
                                    {(canRecord || canEdit) && (
                                        <td className="whitespace-nowrap px-6 py-4 text-right">
                                            <RowActions item={{ ...item, amountPaid }} />
                                        </td>
                                    )}
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            <div className="border-t border-slate-100 bg-slate-50 px-6 py-3 dark:border-slate-800 dark:bg-slate-900/50">
                <p className="text-xs text-slate-500 dark:text-slate-400">
                    Всего платежей: {items.length}
                </p>
            </div>
        </div>
    );
}
