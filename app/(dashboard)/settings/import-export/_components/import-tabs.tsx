"use client";

import { useState } from "react";
import { ImportWizard } from "./import-wizard";
import { PdfImportWizard } from "./pdf-import-wizard";

interface Branch { id: string; name: string }

interface ImportTabsProps {
    branches: Branch[];
    defaultAcademicYear: string;
}

export function ImportTabs({ branches, defaultAcademicYear }: ImportTabsProps) {
    const [activeTab, setActiveTab] = useState<"csv" | "pdf">("csv");

    return (
        <div className="space-y-6">
            <div className="flex gap-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg w-fit">
                <button
                    onClick={() => setActiveTab("csv")}
                    className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${activeTab === "csv"
                        ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm"
                        : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                        }`}
                >
                    Из таблицы (CSV)
                </button>
                <button
                    onClick={() => setActiveTab("pdf")}
                    className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${activeTab === "pdf"
                        ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm"
                        : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                        }`}
                >
                    Из договора (PDF/DOCX)
                </button>
            </div>

            {activeTab === "csv" ? (
                <ImportWizard branches={branches} defaultAcademicYear={defaultAcademicYear} />
            ) : (
                <PdfImportWizard branches={branches} defaultAcademicYear={defaultAcademicYear} />
            )}
        </div>
    );
}
