"use client";

import { useState, useTransition } from "react";
import type { CollectionQueueRow } from "@/lib/db/repositories/collection.repo";
import { updateTaskStatusAction } from "@/lib/actions/collection.actions";

const PRIORITY_CONFIG = {
    high: { label: "Высокий", classes: "bg-red-50 text-red-700 ring-1 ring-red-600/20 dark:bg-red-900/20 dark:text-red-400", border: "border-l-red-500" },
    medium: { label: "Средний", classes: "bg-amber-50 text-amber-700 ring-1 ring-amber-600/20 dark:bg-amber-900/20 dark:text-amber-400", border: "border-l-amber-400" },
    low: { label: "Низкий", classes: "bg-green-50 text-green-700 ring-1 ring-green-600/20 dark:bg-green-900/20 dark:text-green-500", border: "border-l-green-400" },
};

const STATUS_LABELS: Record<string, string> = {
    no_contact: "Нет контакта",
    contacted: "Связались",
    promise_to_pay: "Обещал оплатить",
    refused: "Отказ",
    closed: "Закрыто",
};

const OUTCOME_OPTIONS = [
    { value: "", label: "Выберите исход..." },
    { value: "contacted", label: "Связались" },
    { value: "promise_to_pay", label: "Обещал оплатить" },
    { value: "refused", label: "Отказ" },
    { value: "closed", label: "Закрыто" },
];

const fmtMoney = (n: number) => n.toLocaleString("ru-RU", { maximumFractionDigits: 0 }) + " сом";

interface QueueTableProps {
    rows: CollectionQueueRow[];
    canWrite?: boolean;
}

export function QueueTable({ rows, canWrite = false }: QueueTableProps) {
    const [selected, setSelected] = useState<CollectionQueueRow | null>(null);
    const [search, setSearch] = useState("");
    const [isPending, startTransition] = useTransition();
    const [outcome, setOutcome] = useState("");
    const [note, setNote] = useState("");
    const [saveError, setSaveError] = useState<string | null>(null);
    const [localOverrides, setLocalOverrides] = useState<Record<string, { status: string; note: string }>>({});

    const filtered = rows.filter(r =>
        r.student.fullName.toLowerCase().includes(search.toLowerCase()) ||
        r.student.phone.includes(search)
    );

    function handleSelect(row: CollectionQueueRow) {
        setSelected(row);
        const override = localOverrides[row.paymentItem.id];
        setOutcome(override?.status ?? row.task?.status ?? "");
        setNote(override?.note ?? row.task?.note ?? "");
        setSaveError(null);
    }

    function handleSave(e: React.FormEvent) {
        e.preventDefault();
        if (!selected || !outcome) { setSaveError("Выберите исход звонка"); return; }
        setSaveError(null);
        startTransition(async () => {
            const result = await updateTaskStatusAction({
                taskId: selected.task?.id ?? null,
                studentId: selected.student.id,
                paymentItemId: selected.paymentItem.id,
                status: outcome,
                note,
            });
            if (result.ok) {
                setLocalOverrides(prev => ({
                    ...prev,
                    [selected.paymentItem.id]: { status: outcome, note },
                }));
                setSelected(null);
            } else {
                setSaveError(result.error);
            }
        });
    }

    return (
        <div className="flex gap-4 h-full">
            {/* Table */}
            <div className="flex-1 min-w-0 flex flex-col gap-4">
                {/* Search + header */}
                <div className="flex items-center justify-between">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                        Очередь задач
                        <span className="ml-2 text-sm font-normal text-slate-400">({filtered.length})</span>
                    </h3>
                    <div className="relative">
                        <svg xmlns="http://www.w3.org/2000/svg" className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        <input
                            type="text"
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            placeholder="Поиск по имени или телефону..."
                            className="pl-9 pr-4 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#207fdf]/40 w-64"
                        />
                    </div>
                </div>

                {/* Table */}
                <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-sm">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
                                <tr>
                                    <th className="px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Приоритет</th>
                                    <th className="px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Ученик</th>
                                    <th className="px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Класс / Филиал</th>
                                    <th className="px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Просрочка</th>
                                    <th className="px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Долг</th>
                                    <th className="px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Статус задачи</th>
                                    <th className="px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Открыть</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                {filtered.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="px-5 py-12 text-center text-slate-400 text-sm">
                                            {search ? "Ничего не найдено" : "Просроченных платежей нет 🎉"}
                                        </td>
                                    </tr>
                                ) : filtered.map(row => {
                                    const cfg = PRIORITY_CONFIG[row.priority];
                                    const isSelected = selected?.paymentItem.id === row.paymentItem.id;
                                    const override = localOverrides[row.paymentItem.id];
                                    const taskStatus = override?.status ?? row.task?.status;

                                    return (
                                        <tr
                                            key={row.paymentItem.id}
                                            onClick={() => handleSelect(row)}
                                            className={`cursor-pointer border-l-4 transition-colors ${cfg.border} ${isSelected
                                                ? "bg-[#207fdf]/5 dark:bg-[#207fdf]/10"
                                                : "hover:bg-slate-50 dark:hover:bg-slate-800/50 border-l-transparent"
                                                }`}
                                        >
                                            <td className="px-5 py-3.5">
                                                <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${cfg.classes}`}>
                                                    {cfg.label}
                                                </span>
                                            </td>
                                            <td className="px-5 py-3.5">
                                                <p className="font-semibold text-slate-900 dark:text-white">{row.student.fullName}</p>
                                                <p className="text-xs text-slate-400">{row.student.phone}</p>
                                            </td>
                                            <td className="px-5 py-3.5">
                                                <p className="text-slate-700 dark:text-slate-300">{row.enrollment.grade}</p>
                                                <p className="text-xs text-slate-400">{row.enrollment.branchName}</p>
                                            </td>
                                            <td className={`px-5 py-3.5 text-right font-bold tabular-nums ${row.overdueDays > 10 ? "text-red-600 dark:text-red-400"
                                                : row.overdueDays >= 4 ? "text-amber-600 dark:text-amber-400"
                                                    : "text-slate-600 dark:text-slate-400"
                                                }`}>
                                                {row.overdueDays} дн.
                                            </td>
                                            <td className="px-5 py-3.5 text-right font-semibold text-slate-900 dark:text-white tabular-nums">
                                                {fmtMoney(row.debtAmount)}
                                            </td>
                                            <td className="px-5 py-3.5">
                                                {taskStatus ? (
                                                    <span className="text-xs text-slate-500 dark:text-slate-400">
                                                        {STATUS_LABELS[taskStatus] ?? taskStatus}
                                                    </span>
                                                ) : (
                                                    <span className="text-xs text-slate-300 dark:text-slate-600">—</span>
                                                )}
                                            </td>
                                            <td className="px-5 py-3.5 text-right">
                                                <button className="text-sm font-medium text-[#207fdf] hover:text-[#1a6bc4] transition-colors">
                                                    Открыть →
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Detail Panel */}
            {selected && (
                <div className="w-[380px] flex-shrink-0 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xl flex flex-col overflow-hidden">
                    {/* Panel Header */}
                    <div className="p-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex items-start justify-between">
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <span className={`inline-flex items-center rounded px-2 py-0.5 text-xs font-semibold ${PRIORITY_CONFIG[selected.priority].classes}`}>
                                    {PRIORITY_CONFIG[selected.priority].label} приоритет
                                </span>
                            </div>
                            <h3 className="text-lg font-bold text-slate-900 dark:text-white">{selected.student.fullName}</h3>
                            <p className="text-sm text-slate-500 dark:text-slate-400">{selected.enrollment.grade} · {selected.enrollment.branchName}</p>
                        </div>
                        <button onClick={() => setSelected(null)} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    {/* Scrollable content */}
                    <div className="flex-1 overflow-y-auto p-5 space-y-5">
                        {/* Debt block */}
                        <div className="rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 p-4">
                            <div className="flex justify-between items-center mb-1">
                                <span className="text-sm font-semibold text-red-700 dark:text-red-400">Сумма долга</span>
                                <span className="text-xs bg-white dark:bg-slate-800 border border-red-200 dark:border-red-700 text-red-600 dark:text-red-400 px-2 py-0.5 rounded-full font-medium">
                                    {selected.overdueDays} дней просрочки
                                </span>
                            </div>
                            <p className="text-2xl font-bold text-slate-900 dark:text-white">{fmtMoney(selected.debtAmount)}</p>
                            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{selected.paymentItem.label} · срок {selected.paymentItem.dueDate}</p>
                        </div>

                        {/* Contact */}
                        <div className="space-y-3">
                            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Контакты</h4>
                            <a
                                href={`tel:${selected.student.phone}`}
                                className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-[#207fdf]/40 transition-colors group"
                            >
                                <div className="w-9 h-9 rounded-full bg-[#207fdf]/10 flex items-center justify-center text-[#207fdf] flex-shrink-0">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                    </svg>
                                </div>
                                <div className="flex-1">
                                    <p className="text-xs text-slate-400">Телефон</p>
                                    <p className="text-sm font-semibold text-slate-900 dark:text-white">{selected.student.phone}</p>
                                </div>
                                <span className="text-xs text-[#207fdf] font-medium opacity-0 group-hover:opacity-100 transition-opacity">Позвонить →</span>
                            </a>
                        </div>

                        {/* Current note */}
                        {(localOverrides[selected.paymentItem.id]?.note ?? selected.task?.note) && (
                            <div className="space-y-2">
                                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Последняя заметка</h4>
                                <p className="text-sm text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800 rounded-lg p-3 border border-slate-200 dark:border-slate-700">
                                    {localOverrides[selected.paymentItem.id]?.note ?? selected.task?.note}
                                </p>
                                <p className="text-xs text-slate-400">
                                    Обновлено: {selected.task?.updatedAt
                                        ? new Date(selected.task.updatedAt).toLocaleDateString("ru-RU", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })
                                        : "сейчас"}
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Log call form */}
                    {canWrite && (
                        <form onSubmit={handleSave} className="p-5 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-3">
                            <h4 className="text-sm font-bold text-slate-900 dark:text-white">Записать результат звонка</h4>
                            {saveError && (
                                <p className="text-xs text-red-600 dark:text-red-400">{saveError}</p>
                            )}
                            <select
                                value={outcome}
                                onChange={e => setOutcome(e.target.value)}
                                className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm text-slate-900 dark:text-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#207fdf]/40"
                            >
                                {OUTCOME_OPTIONS.map(opt => (
                                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                                ))}
                            </select>
                            <textarea
                                value={note}
                                onChange={e => setNote(e.target.value)}
                                rows={3}
                                placeholder="Добавьте заметку..."
                                className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm text-slate-900 dark:text-white px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-[#207fdf]/40"
                            />
                            <div className="flex gap-2">
                                <button
                                    type="submit"
                                    disabled={isPending || !outcome}
                                    className="flex-1 bg-[#207fdf] text-white text-sm font-semibold py-2.5 rounded-lg hover:bg-[#1a6bc4] disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm shadow-blue-500/20"
                                >
                                    {isPending ? "Сохранение…" : "Сохранить"}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setSelected(null)}
                                    className="px-4 py-2.5 text-sm font-semibold text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                                >
                                    Отмена
                                </button>
                            </div>
                        </form>
                    )}
                </div>
            )}
        </div>
    );
}
