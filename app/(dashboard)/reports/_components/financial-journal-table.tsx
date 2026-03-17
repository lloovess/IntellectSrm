"use client";

import { useState } from "react";
import type { FinancialJournalRow } from "@/types/financial-journal";

const fmtMoney = (value: number | null) => value === null
    ? "—"
    : `${value.toLocaleString("ru-RU", { maximumFractionDigits: 2 })} сом`;

export function FinancialJournalTable({ rows }: { rows: FinancialJournalRow[] }) {
    const [selected, setSelected] = useState<FinancialJournalRow | null>(null);

    return (
        <>
            <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 dark:bg-slate-800/80">
                        <tr>
                            <th className="px-4 py-3 font-semibold">Событие</th>
                            <th className="px-4 py-3 font-semibold">Ученик</th>
                            <th className="px-4 py-3 font-semibold">Договор / платеж</th>
                            <th className="px-4 py-3 font-semibold">Сумма</th>
                            <th className="px-4 py-3 font-semibold">Кто оплатил</th>
                            <th className="px-4 py-3 font-semibold">Кто внес / изменил</th>
                            <th className="px-4 py-3 font-semibold">Когда</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {rows.map((row) => (
                            <tr
                                key={row.id}
                                className="cursor-pointer transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/60"
                                onClick={() => setSelected(row)}
                            >
                                <td className="px-4 py-3">
                                    <p className="font-semibold text-slate-900 dark:text-white">{row.title}</p>
                                    <p className="text-xs text-slate-500 dark:text-slate-400">{row.summary[0] ?? row.eventType}</p>
                                </td>
                                <td className="px-4 py-3">
                                    <p className="font-medium text-slate-800 dark:text-slate-200">{row.studentName ?? "—"}</p>
                                    <p className="text-xs text-slate-500 dark:text-slate-400">{row.branchName ?? "—"}</p>
                                </td>
                                <td className="px-4 py-3">
                                    <p className="text-slate-800 dark:text-slate-200">{row.contractNumber ? `#${row.contractNumber}` : "—"}</p>
                                    <p className="text-xs text-slate-500 dark:text-slate-400">{row.paymentLabel ?? "—"}</p>
                                </td>
                                <td className="px-4 py-3 font-semibold text-slate-900 dark:text-white">{fmtMoney(row.amount)}</td>
                                <td className="px-4 py-3">
                                    <p className="text-slate-800 dark:text-slate-200">{row.payerName ?? "—"}</p>
                                    <p className="text-xs text-slate-500 dark:text-slate-400">{row.payerPhone ?? row.source ?? "—"}</p>
                                </td>
                                <td className="px-4 py-3">
                                    <p className="text-slate-800 dark:text-slate-200">{row.actor ?? "—"}</p>
                                    <p className="text-xs text-slate-500 dark:text-slate-400">{row.eventType}</p>
                                </td>
                                <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                                    {new Date(row.happenedAt).toLocaleString("ru-RU", {
                                        day: "2-digit",
                                        month: "2-digit",
                                        year: "numeric",
                                        hour: "2-digit",
                                        minute: "2-digit",
                                    })}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {selected && (
                <div className="fixed inset-0 z-50 flex" onClick={() => setSelected(null)}>
                    <div className="flex-1 bg-black/40" />
                    <div className="h-full w-full max-w-xl overflow-y-auto border-l border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-950" onClick={(event) => event.stopPropagation()}>
                        <div className="flex items-start justify-between gap-4">
                            <div>
                                <h2 className="text-xl font-bold text-slate-900 dark:text-white">{selected.title}</h2>
                                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                                    {new Date(selected.happenedAt).toLocaleString("ru-RU")}
                                </p>
                            </div>
                            <button className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200" onClick={() => setSelected(null)}>
                                ✕
                            </button>
                        </div>

                        <div className="mt-6 space-y-4">
                            <section className="rounded-xl border border-slate-200 p-4 dark:border-slate-800">
                                <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Контекст</h3>
                                <div className="mt-3 space-y-2 text-sm">
                                    <p><span className="font-medium">Ученик:</span> {selected.studentName ?? "—"}</p>
                                    <p><span className="font-medium">Филиал:</span> {selected.branchName ?? "—"}</p>
                                    <p><span className="font-medium">Договор:</span> {selected.contractNumber ? `#${selected.contractNumber}` : "—"}</p>
                                    <p><span className="font-medium">Платеж:</span> {selected.paymentLabel ?? "—"}</p>
                                    <p><span className="font-medium">Сумма:</span> {fmtMoney(selected.amount)}</p>
                                    <p><span className="font-medium">Плательщик:</span> {selected.payerName ?? "—"} {selected.payerPhone ? `(${selected.payerPhone})` : ""}</p>
                                    <p><span className="font-medium">Кто внес / изменил:</span> {selected.actor ?? "—"}</p>
                                </div>
                            </section>

                            {selected.allocationSummary.length > 0 && (
                                <section className="rounded-xl border border-slate-200 p-4 dark:border-slate-800">
                                    <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Распределение</h3>
                                    <div className="mt-3 space-y-2 text-sm">
                                        {selected.allocationSummary.map((item, index) => (
                                            <p key={`${item.paymentItemId}-${index}`}>
                                                <span className="font-medium">{item.label}:</span> {fmtMoney(item.allocatedAmount)} ({item.kind})
                                            </p>
                                        ))}
                                    </div>
                                </section>
                            )}

                            {selected.diff.length > 0 && (
                                <section className="rounded-xl border border-slate-200 p-4 dark:border-slate-800">
                                    <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Изменения</h3>
                                    <div className="mt-3 space-y-2 text-sm">
                                        {selected.diff.map((item) => (
                                            <p key={item.field}>
                                                <span className="font-medium">{item.label}:</span> {item.before} {"->"} {item.after}
                                            </p>
                                        ))}
                                    </div>
                                </section>
                            )}

                            <section className="rounded-xl border border-slate-200 p-4 dark:border-slate-800">
                                <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Краткое описание</h3>
                                <div className="mt-3 space-y-2 text-sm">
                                    {selected.summary.length > 0 ? selected.summary.map((item, index) => <p key={index}>{item}</p>) : <p>Нет дополнительной информации</p>}
                                </div>
                            </section>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
