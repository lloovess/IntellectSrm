"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import type { ImportResult } from "@/lib/import/csv";

interface Step4Props {
    validCount: number;
    onImport: () => Promise<ImportResult>;
    onBack: () => void;
    onReset: () => void;
}

export function Step4Import({ validCount, onImport, onBack, onReset }: Step4Props) {
    const [isPending, startTransition] = useTransition();
    const [result, setResult] = useState<ImportResult | null>(null);
    const [error, setError] = useState<string | null>(null);

    const handleImport = () => {
        setError(null);
        startTransition(async () => {
            try {
                const r = await onImport();
                setResult(r);
            } catch (err) {
                setError(err instanceof Error ? err.message : "Ошибка импорта");
            }
        });
    };

    if (result) {
        return (
            <div className="space-y-6">
                {/* Success header */}
                <div className="text-center py-6">
                    <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto mb-4">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white">Импорт завершён</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Данные сохранены в системе</p>
                </div>

                {/* Summary */}
                <div className="grid grid-cols-3 gap-4">
                    <div className="rounded-xl border border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20 p-4 text-center">
                        <p className="text-3xl font-bold text-green-700 dark:text-green-400">{result.imported}</p>
                        <p className="text-sm text-green-600 dark:text-green-500 mt-1">Импортировано</p>
                    </div>
                    <div className="rounded-xl border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20 p-4 text-center">
                        <p className="text-3xl font-bold text-amber-700 dark:text-amber-400">{result.skipped}</p>
                        <p className="text-sm text-amber-600 dark:text-amber-500 mt-1">Пропущено</p>
                    </div>
                    <div className="rounded-xl border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 p-4 text-center">
                        <p className="text-3xl font-bold text-red-700 dark:text-red-400">{result.errors.length}</p>
                        <p className="text-sm text-red-600 dark:text-red-500 mt-1">Ошибок</p>
                    </div>
                </div>

                {/* Error log */}
                {result.errors.length > 0 && (
                    <div className="rounded-xl border border-red-200 dark:border-red-800 overflow-hidden">
                        <div className="px-4 py-3 bg-red-50 dark:bg-red-900/20 border-b border-red-200 dark:border-red-800">
                            <p className="text-sm font-semibold text-red-700 dark:text-red-400">Ошибки импорта</p>
                        </div>
                        <div className="max-h-40 overflow-y-auto">
                            {result.errors.map((e, i) => (
                                <div key={i} className="px-4 py-2.5 text-xs border-b border-red-100 dark:border-red-900 last:border-0">
                                    <span className="font-semibold text-red-600 dark:text-red-400">Строка {e.row}:</span>{" "}
                                    <span className="text-slate-600 dark:text-slate-400">{e.error}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                <div className="flex gap-3 justify-center pt-2">
                    <button
                        onClick={onReset}
                        className="px-6 py-2.5 text-sm font-semibold bg-[#207fdf] text-white rounded-lg hover:bg-[#1a6bc4] transition-colors shadow-sm"
                    >
                        Новый импорт
                    </button>
                    <Link
                        href="/students"
                        className="px-6 py-2.5 text-sm font-semibold border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                    >
                        Перейти к ученикам →
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Pre-import summary */}
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 p-8 text-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-[#207fdf]/10 flex items-center justify-center mx-auto">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-[#207fdf]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                    </svg>
                </div>
                <div>
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white">Готово к импорту</h3>
                    <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
                        Будет создано <strong className="text-slate-900 dark:text-white">{validCount}</strong> записей учеников со всеми договорами и планами платежей
                    </p>
                </div>
                <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3 text-xs text-amber-700 dark:text-amber-400 text-left">
                    ⚠️ После импорта данные нельзя автоматически откатить. Убедитесь что CSV правильный.
                </div>
            </div>

            {error && (
                <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 text-sm">
                    {error}
                </div>
            )}

            {/* Loading state */}
            {isPending && (
                <div className="flex flex-col items-center gap-3 py-4">
                    <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2">
                        <div className="bg-[#207fdf] h-2 rounded-full animate-pulse w-3/4" />
                    </div>
                    <p className="text-sm text-slate-500 animate-pulse">Импортируем данные... ({validCount} строк)</p>
                </div>
            )}

            <div className="flex justify-between pt-2">
                <button
                    onClick={onBack}
                    disabled={isPending}
                    className="px-5 py-2.5 text-sm font-semibold text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-50 transition-colors"
                >
                    ← Назад
                </button>
                <button
                    onClick={handleImport}
                    disabled={isPending || validCount === 0}
                    className="px-6 py-2.5 text-sm font-semibold bg-[#207fdf] text-white rounded-lg hover:bg-[#1a6bc4] disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm shadow-blue-500/20"
                >
                    {isPending ? "Импортируем…" : `Начать импорт ${validCount} строк`}
                </button>
            </div>
        </div>
    );
}
