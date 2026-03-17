"use client";

import { useRef, useState } from "react";
import { autoDetectScore, detectColumns, parseCSV, type ColumnMapping, type RawRow } from "@/lib/import/csv";

interface Step1Props {
    onParsed: (headers: string[], rows: RawRow[], mapping: ColumnMapping, score: number) => void;
}

export function Step1Upload({ onParsed }: Step1Props) {
    const [isDragging, setIsDragging] = useState(false);
    const [filename, setFilename] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [preview, setPreview] = useState<RawRow[]>([]);
    const [previewHeaders, setPreviewHeaders] = useState<string[]>([]);
    const inputRef = useRef<HTMLInputElement>(null);

    const processFile = async (file: File) => {
        setError(null);
        if (!file.name.endsWith(".csv")) {
            setError("Файл должен быть в формате .csv");
            return;
        }
        const text = await file.text();
        const { headers, rows } = parseCSV(text);
        if (rows.length === 0) { setError("CSV файл пуст или неправильный формат"); return; }

        const mapping = detectColumns(headers);
        const score = autoDetectScore(mapping);
        setFilename(file.name);
        setPreviewHeaders(headers.slice(0, 6));
        setPreview(rows.slice(0, 3));
        onParsed(headers, rows, mapping, score);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        const file = e.dataTransfer.files[0];
        if (file) processFile(file);
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) processFile(file);
    };

    return (
        <div className="space-y-6">
            {/* Drop zone */}
            <div
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                onClick={() => inputRef.current?.click()}
                className={`cursor-pointer border-2 border-dashed rounded-xl p-12 flex flex-col items-center text-center transition-colors ${isDragging
                        ? "border-[#207fdf] bg-[#207fdf]/10"
                        : filename
                            ? "border-green-400 bg-green-50 dark:bg-green-900/10"
                            : "border-[#207fdf]/30 bg-[#207fdf]/5 hover:border-[#207fdf]/60 hover:bg-[#207fdf]/10"
                    }`}
            >
                <input ref={inputRef} type="file" accept=".csv" className="hidden" onChange={handleChange} />
                <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 ${filename ? "bg-green-100 dark:bg-green-900/30" : "bg-[#207fdf]/10"}`}>
                    {filename ? (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-[#207fdf]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                        </svg>
                    )}
                </div>
                {filename ? (
                    <>
                        <p className="font-semibold text-green-700 dark:text-green-400">{filename}</p>
                        <p className="text-sm text-slate-500 mt-1">Нажмите чтобы выбрать другой файл</p>
                    </>
                ) : (
                    <>
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
                            Загрузите CSV файл из Google Sheets
                        </h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm mb-4">
                            Перетащите файл сюда или нажмите для выбора. Формат: Экспорт из Google Таблицы как .csv
                        </p>
                        <div className="flex gap-3">
                            <button type="button" className="bg-[#207fdf] text-white px-5 py-2 rounded-lg text-sm font-semibold hover:bg-[#1a6bc4] transition-colors shadow-sm shadow-blue-500/20">
                                Выбрать файл
                            </button>
                        </div>
                    </>
                )}
            </div>

            {error && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 text-sm">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {error}
                </div>
            )}

            {/* Preview */}
            {preview.length > 0 && (
                <div className="rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
                    <div className="px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
                        <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">Предпросмотр (первые 3 строки)</p>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-xs">
                            <thead className="bg-slate-50 dark:bg-slate-800">
                                <tr>
                                    {previewHeaders.map(h => (
                                        <th key={h} className="px-3 py-2 text-left font-semibold text-slate-500 whitespace-nowrap">{h}</th>
                                    ))}
                                    {previewHeaders.length < 6 ? null : <th className="px-3 py-2 text-slate-400">...</th>}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                {preview.map((row, i) => (
                                    <tr key={i}>
                                        {previewHeaders.map(h => (
                                            <td key={h} className="px-3 py-2 text-slate-600 dark:text-slate-400 whitespace-nowrap max-w-[120px] truncate">{row[h]}</td>
                                        ))}
                                        {previewHeaders.length < 6 ? null : <td className="px-3 py-2 text-slate-400">...</td>}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}
