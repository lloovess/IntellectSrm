"use client";

import React, { useEffect, useState } from "react";
import { PDFViewer } from "@react-pdf/renderer";
import { ContractDocument, type PdfContractData } from "./contract-document";

interface ContractPdfPreviewProps {
    data: PdfContractData;
}

export default function ContractPdfPreview({ data }: ContractPdfPreviewProps) {
    const [mounted, setMounted] = useState(false);
    useEffect(() => setMounted(true), []);

    if (!mounted) {
        return (
            <div className="flex items-center justify-center h-full text-slate-400 text-sm">
                Загрузка документа…
            </div>
        );
    }

    return (
        <PDFViewer width="100%" height="100%" showToolbar={false} style={{ border: 0, position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}>
            <ContractDocument data={data} />
        </PDFViewer>
    );
}
