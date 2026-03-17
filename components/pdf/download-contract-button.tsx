"use client";

import React, { useCallback, useState } from "react";
import { pdf } from "@react-pdf/renderer";
import { ContractDocument, type PdfContractData } from "./contract-document";

interface Props {
    data: PdfContractData;
}

export default function DownloadContractButton({ data }: Props) {
    const [loading, setLoading] = useState(false);

    const handleDownload = useCallback(async () => {
        try {
            setLoading(true);
            const blob = await pdf(<ContractDocument data={data} />).toBlob();
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `Договор_${data.contractNumber}_${data.studentName}.pdf`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        } catch (err) {
            console.error("PDF generation error:", err);
            alert("Ошибка при генерации PDF. Попробуйте ещё раз.");
        } finally {
            setLoading(false);
        }
    }, [data]);

    return (
        <button
            onClick={handleDownload}
            disabled={loading}
            className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 transition-colors disabled:opacity-50 disabled:cursor-wait"
        >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            {loading ? "Генерация..." : "Скачать PDF"}
        </button>
    );
}
