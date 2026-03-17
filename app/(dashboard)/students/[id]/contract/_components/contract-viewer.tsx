"use client";

import React, { useEffect, useState } from "react";
import { pdf } from "@react-pdf/renderer";
import { ContractDocument, type PdfContractData } from "@/components/pdf/contract-document";

interface Props {
    data: PdfContractData;
}

export function ContractViewer({ data }: Props) {
    const [pdfUrl, setPdfUrl] = useState<string | null>(null);
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        return () => {
            if (pdfUrl) URL.revokeObjectURL(pdfUrl);
        };
    }, [pdfUrl]);

    const handleOpen = async () => {
        if (isOpen && pdfUrl) {
            setIsOpen(false);
            return;
        }

        try {
            setLoading(true);
            setError(null);
            const blob = await pdf(<ContractDocument data={data} />).toBlob();
            const url = URL.createObjectURL(blob);
            setPdfUrl(url);
            setIsOpen(true);
        } catch (err) {
            console.error("PDF preview error:", err);
            setError("Ошибка при генерации предпросмотра");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div>
            <button
                onClick={handleOpen}
                disabled={loading}
                className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 transition-colors disabled:opacity-50"
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                {loading ? "Загрузка..." : isOpen ? "Скрыть договор" : "Просмотр договора"}
            </button>

            {error && (
                <p className="mt-2 text-sm text-red-500">{error}</p>
            )}

            {isOpen && pdfUrl && (
                <div className="mt-4 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-lg bg-white dark:bg-slate-900">
                    <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800">
                        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                            📄 Предпросмотр договора
                        </span>
                        <button
                            onClick={() => setIsOpen(false)}
                            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                    <iframe
                        src={pdfUrl}
                        className="w-full border-0"
                        style={{ height: "80vh" }}
                        title="Предпросмотр договора"
                    />
                </div>
            )}
        </div>
    );
}
