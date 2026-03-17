"use client";

import type { ColumnMapping, RawRow, ValidatedRow } from "@/lib/import/csv";

interface Step3Props {
    rows: ValidatedRow[];
    allRows: RawRow[];
    mapping: ColumnMapping;
    onNext: () => void;
    onBack: () => void;
}

export function Step3Preview({ rows, allRows, mapping, onNext, onBack }: Step3Props) {
    const validCount = rows.filter(r => r.valid).length;
    const invalidCount = rows.filter(r => !r.valid).length;

    const displayCols = [
        mapping.fullName,
        mapping.phone,
        mapping.contractNumber,
        mapping.basePrice,
        mapping.monthlyAmount,
    ].filter(Boolean) as string[];

    const exportErrors = () => {
        const invalid = rows.filter(r => !r.valid);
        const lines = ["Строка,ФИО,Ошибки", ...invalid.map(r => {
            const name = mapping.fullName ? r.raw[mapping.fullName] ?? "" : "";
            return `${r.rowIndex},"${name}","${r.errors.join("; ")}"`;
        })];
        const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url; a.download = "import_errors.csv"; a.click();
        URL.revokeObjectURL(url);
    };

    return (
        <div className="space-y-5">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
                {/* Table */}
                <div className="lg:col-span-3 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
                    <div className="px-5 py-3 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
                        <p className="text-sm font-semibold">Предпросмотр и валидация</p>
                        <p className="text-xs text-slate-400">{rows.length} строк</p>
                    </div>
                    <div className="overflow-x-auto max-h-96 overflow-y-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="sticky top-0 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800">
                                <tr>
                                    <th className="px-4 py-3 text-xs font-semibold text-slate-500">#</th>
                                    {displayCols.map(c => <th key={c} className="px-4 py-3 text-xs font-semibold text-slate-500 whitespace-nowrap">{c}</th>)}
                                    <th className="px-4 py-3 text-xs font-semibold text-slate-500">Статус</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                {rows.map(row => (
                                    <tr key={row.rowIndex} className={row.valid ? "" : "bg-red-50/40 dark:bg-red-900/10"}>
                                        <td className="px-4 py-3 text-slate-400 text-xs">{row.rowIndex}</td>
                                        {displayCols.map(c => (
                                            <td key={c} className={`px-4 py-3 text-xs max-w-[140px] truncate ${!row.valid && row.errors.some(e => e.toLowerCase().includes((c ?? "").toLowerCase())) ? "text-red-600 dark:text-red-400" : "text-slate-700 dark:text-slate-300"}`}>
                                                {row.raw[c] ?? "—"}
                                            </td>
                                        ))}
                                        <td className="px-4 py-3">
                                            {row.valid ? (
                                                <span className="inline-flex items-center gap-1 text-xs font-medium text-green-700 dark:text-green-400">
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                                    </svg>
                                                    ОК
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1 text-xs font-medium text-red-600 dark:text-red-400" title={row.errors.join("; ")}>
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                                    </svg>
                                                    {row.errors[0]}
                                                </span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Summary sidebar */}
                <div className="space-y-4">
                    <div className="rounded-xl border border-slate-200 dark:border-slate-800 p-5 space-y-3">
                        <p className="text-sm font-bold text-slate-900 dark:text-white">Итог валидации</p>
                        <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                            <span className="text-sm text-slate-600 dark:text-slate-400">Всего строк</span>
                            <span className="font-bold text-slate-900 dark:text-white">{rows.length}</span>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                            <span className="text-sm text-green-700 dark:text-green-400">Валидных</span>
                            <span className="font-bold text-green-700 dark:text-green-400">{validCount}</span>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                            <span className="text-sm text-red-700 dark:text-red-400">Ошибок</span>
                            <span className="font-bold text-red-700 dark:text-red-400">{invalidCount}</span>
                        </div>
                    </div>

                    {invalidCount > 0 && (
                        <button
                            onClick={exportErrors}
                            className="w-full border border-slate-200 dark:border-slate-700 text-sm font-semibold py-2.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-slate-600 dark:text-slate-300"
                        >
                            ↓ Экспорт ошибок
                        </button>
                    )}
                </div>
            </div>

            <div className="flex justify-between pt-2">
                <button onClick={onBack} className="px-5 py-2.5 text-sm font-semibold text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                    ← Назад
                </button>
                <button
                    onClick={onNext}
                    disabled={validCount === 0}
                    className="px-5 py-2.5 text-sm font-semibold bg-[#207fdf] text-white rounded-lg hover:bg-[#1a6bc4] disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
                >
                    Импортировать {validCount} строк →
                </button>
            </div>
        </div>
    );
}
