"use client";

import { KZ_MONTHS, type ColumnMapping } from "@/lib/import/csv";

const SYSTEM_FIELDS = [
    { value: "__none__", label: "— Не импортировать —" },
    { value: "__fullName__", label: "ФИО" },
    { value: "__phone__", label: "Телефон" },
    { value: "__contractNumber__", label: "Номер договора" },
    { value: "__basePrice__", label: "Сумма договора (со скидкой)" },
    { value: "__monthlyAmount__", label: "Оплата/мес" },
    { value: "__prepayment__", label: "Первый взнос" },
    ...KZ_MONTHS.map(m => ({ value: `__month_${m}__`, label: `Месяц: ${m}` })),
];

interface Branch { id: string; name: string }

interface Step2Props {
    headers: string[];
    mapping: ColumnMapping;
    score: number;
    branches: Branch[];
    branchId: string;
    grade: string;
    academicYear: string;
    onMappingChange: (m: ColumnMapping) => void;
    onConfigChange: (branchId: string, grade: string, year: string) => void;
    onNext: () => void;
    onBack: () => void;
}

/** Get current system field value for a CSV column */
function getFieldValue(col: string, mapping: ColumnMapping): string {
    if (mapping.fullName === col) return "__fullName__";
    if (mapping.phone === col) return "__phone__";
    if (mapping.contractNumber === col) return "__contractNumber__";
    if (mapping.basePrice === col) return "__basePrice__";
    if (mapping.monthlyAmount === col) return "__monthlyAmount__";
    if (mapping.prepayment === col) return "__prepayment__";
    for (const [label, c] of Object.entries(mapping.months)) {
        if (c === col) return `__month_${label}__`;
    }
    return "__none__";
}

/** Update mapping when select changes */
function applyFieldChange(col: string, value: string, prev: ColumnMapping): ColumnMapping {
    const m = { ...prev, months: { ...prev.months } };
    // Clear previous assignment of this column
    if (m.fullName === col) m.fullName = null;
    if (m.phone === col) m.phone = null;
    if (m.contractNumber === col) m.contractNumber = null;
    if (m.basePrice === col) m.basePrice = null;
    if (m.monthlyAmount === col) m.monthlyAmount = null;
    if (m.prepayment === col) m.prepayment = null;
    for (const label of Object.keys(m.months)) {
        if (m.months[label] === col) delete m.months[label];
    }
    // Apply new
    if (value === "__fullName__") m.fullName = col;
    else if (value === "__phone__") m.phone = col;
    else if (value === "__contractNumber__") m.contractNumber = col;
    else if (value === "__basePrice__") m.basePrice = col;
    else if (value === "__monthlyAmount__") m.monthlyAmount = col;
    else if (value === "__prepayment__") m.prepayment = col;
    else if (value.startsWith("__month_")) {
        const label = value.replace("__month_", "").replace("__", "");
        m.months[label] = col;
    }
    return m;
}

const GRADES = ["1А", "1Б", "2А", "2Б", "3А", "3Б", "4А", "4Б", "5А", "5Б", "6А", "6Б", "7А", "7Б", "8А", "8Б", "9А", "9Б", "10А", "10Б", "11А", "11Б"];
const YEARS = ["2023-2024", "2024-2025", "2025-2026", "2026-2027"];

export function Step2Mapping({ headers, mapping, score, branches, branchId, grade, academicYear, onMappingChange, onConfigChange, onNext, onBack }: Step2Props) {
    const requiredMapped = !!(mapping.fullName && mapping.phone && mapping.basePrice);
    const canProceed = requiredMapped && branchId && grade && academicYear;

    return (
        <div className="space-y-6">
            {/* Auto-detect score */}
            <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                <div>
                    <p className="text-sm font-semibold text-slate-900 dark:text-white">Авто-определение колонок</p>
                    <p className="text-xs text-slate-500 mt-0.5">Проверьте маппинг и исправьте при необходимости</p>
                </div>
                <span className={`text-sm font-bold px-3 py-1 rounded-full ${score >= 70 ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" : "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"}`}>
                    Авто: {score}%
                </span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Column mapping table */}
                <div className="lg:col-span-2 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
                    <div className="px-5 py-3 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
                        <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">Маппинг колонок CSV → Система</p>
                    </div>
                    <div className="max-h-80 overflow-y-auto">
                        <table className="w-full text-sm">
                            <thead className="sticky top-0 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800">
                                <tr>
                                    <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Колонка CSV</th>
                                    <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Поле системы</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                {headers.map(col => {
                                    const val = getFieldValue(col, mapping);
                                    const isUnmapped = val === "__none__";
                                    return (
                                        <tr key={col} className={isUnmapped ? "" : "bg-[#207fdf]/3"}>
                                            <td className="px-5 py-3">
                                                <p className="font-medium text-slate-800 dark:text-slate-200">{col}</p>
                                            </td>
                                            <td className="px-5 py-3">
                                                <select
                                                    value={val}
                                                    onChange={e => onMappingChange(applyFieldChange(col, e.target.value, mapping))}
                                                    className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-[#207fdf]/40"
                                                >
                                                    {SYSTEM_FIELDS.map(f => (
                                                        <option key={f.value} value={f.value}>{f.label}</option>
                                                    ))}
                                                </select>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Import config */}
                <div className="space-y-4">
                    <div className="rounded-xl border border-slate-200 dark:border-slate-800 p-5 space-y-4">
                        <p className="text-sm font-bold text-slate-900 dark:text-white">Параметры импорта</p>

                        <div className="space-y-1">
                            <label className="text-xs font-semibold text-slate-500 uppercase">Филиал *</label>
                            <select
                                value={branchId}
                                onChange={e => onConfigChange(e.target.value, grade, academicYear)}
                                className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#207fdf]/40"
                            >
                                <option value="">Выберите филиал...</option>
                                {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                            </select>
                        </div>

                        <div className="space-y-1">
                            <label className="text-xs font-semibold text-slate-500 uppercase">Класс *</label>
                            <select
                                value={grade}
                                onChange={e => onConfigChange(branchId, e.target.value, academicYear)}
                                className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#207fdf]/40"
                            >
                                <option value="">Выберите класс...</option>
                                {GRADES.map(g => <option key={g} value={g}>{g}</option>)}
                            </select>
                        </div>

                        <div className="space-y-1">
                            <label className="text-xs font-semibold text-slate-500 uppercase">Учебный год *</label>
                            <select
                                value={academicYear}
                                onChange={e => onConfigChange(branchId, grade, e.target.value)}
                                className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#207fdf]/40"
                            >
                                {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
                            </select>
                        </div>
                    </div>

                    {!requiredMapped && (
                        <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 text-xs text-amber-700 dark:text-amber-400">
                            Обязательно: ФИО, Телефон, Сумма договора
                        </div>
                    )}
                </div>
            </div>

            {/* Navigation */}
            <div className="flex justify-between pt-2">
                <button onClick={onBack} className="px-5 py-2.5 text-sm font-semibold text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                    ← Назад
                </button>
                <button
                    onClick={onNext}
                    disabled={!canProceed}
                    className="px-5 py-2.5 text-sm font-semibold bg-[#207fdf] text-white rounded-lg hover:bg-[#1a6bc4] disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
                >
                    Продолжить →
                </button>
            </div>
        </div>
    );
}
