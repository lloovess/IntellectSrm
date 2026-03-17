"use client";

import { useState, useCallback } from "react";
import { validateRows, type ColumnMapping, type RawRow, type ValidatedRow, type ImportResult } from "@/lib/import/csv";
import { Step1Upload } from "./step1-upload";
import { Step2Mapping } from "./step2-mapping";
import { Step3Preview } from "./step3-preview";
import { Step4Import } from "./step4-import";

interface Branch { id: string; name: string }

interface ImportWizardProps {
    branches: Branch[];
    defaultAcademicYear: string;
}

const STEP_LABELS = ["Загрузка файла", "Маппинг колонок", "Валидация", "Импорт"];

export function ImportWizard({ branches, defaultAcademicYear }: ImportWizardProps) {
    const [step, setStep] = useState(1);

    // Step 1 state
    const [headers, setHeaders] = useState<string[]>([]);
    const [rawRows, setRawRows] = useState<RawRow[]>([]);
    const [mapping, setMapping] = useState<ColumnMapping>({
        fullName: null, phone: null, contractNumber: null,
        basePrice: null, monthlyAmount: null, prepayment: null, months: {},
    });
    const [score, setScore] = useState(0);

    // Step 2 state
    const [branchId, setBranchId] = useState("");
    const [grade, setGrade] = useState("");
    const [academicYear, setAcademicYear] = useState(defaultAcademicYear);

    // Step 3 state
    const [validated, setValidated] = useState<ValidatedRow[]>([]);

    const handleParsed = useCallback((h: string[], r: RawRow[], m: ColumnMapping, sc: number) => {
        setHeaders(h);
        setRawRows(r);
        setMapping(m);
        setScore(sc);
    }, []);

    const handleConfigChange = useCallback((b: string, g: string, y: string) => {
        setBranchId(b); setGrade(g); setAcademicYear(y);
    }, []);

    const goToStep3 = () => {
        const v = validateRows(rawRows, mapping);
        setValidated(v);
        setStep(3);
    };

    const handleImport = async (): Promise<ImportResult> => {
        const formData = new FormData();
        // Re-encode rows back to CSV for sending
        const csvLines = [headers.join(","), ...rawRows.map(row => headers.map(h => `"${(row[h] ?? "").replace(/"/g, '""')}"`).join(","))];
        const blob = new Blob([csvLines.join("\n")], { type: "text/csv" });
        formData.append("file", blob, "import.csv");
        formData.append("config", JSON.stringify({ branchId, grade, academicYear, mapping }));

        const res = await fetch("/api/import/students", { method: "POST", body: formData });
        if (!res.ok) {
            const err = await res.json();
            throw new Error(err.error ?? "Ошибка импорта");
        }
        return res.json() as Promise<ImportResult>;
    };

    const reset = () => {
        setStep(1);
        setHeaders([]); setRawRows([]); setValidated([]);
        setMapping({ fullName: null, phone: null, contractNumber: null, basePrice: null, monthlyAmount: null, prepayment: null, months: {} });
        setBranchId(""); setGrade(""); setAcademicYear(defaultAcademicYear);
    };

    const canGoStep2 = rawRows.length > 0;
    const validCount = validated.filter(r => r.valid).length;

    return (
        <div className="space-y-8">
            {/* Step indicator */}
            <div className="relative">
                <div className="absolute top-5 left-0 right-0 h-0.5 bg-slate-200 dark:bg-slate-700" />
                <div
                    className="absolute top-5 left-0 h-0.5 bg-[#207fdf] transition-all duration-500"
                    style={{ width: `${((step - 1) / 3) * 100}%` }}
                />
                <div className="relative grid grid-cols-4 gap-4">
                    {STEP_LABELS.map((label, i) => {
                        const n = i + 1;
                        const isComplete = step > n;
                        const isCurrent = step === n;
                        return (
                            <div key={n} className="flex flex-col items-center gap-2">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ring-4 ring-white dark:ring-slate-950 z-10 transition-colors ${isComplete ? "bg-[#207fdf] text-white"
                                        : isCurrent ? "bg-[#207fdf] text-white"
                                            : "bg-slate-200 dark:bg-slate-700 text-slate-500"
                                    }`}>
                                    {isComplete ? (
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                        </svg>
                                    ) : n}
                                </div>
                                <span className={`text-xs font-semibold text-center ${isCurrent ? "text-[#207fdf]" : isComplete ? "text-[#207fdf]" : "text-slate-400"}`}>
                                    {label}
                                </span>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Step content */}
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
                {step === 1 && (
                    <>
                        <Step1Upload onParsed={(h, r, m, sc) => { handleParsed(h, r, m, sc); }} />
                        <div className="flex justify-end mt-6">
                            <button
                                disabled={!canGoStep2}
                                onClick={() => setStep(2)}
                                className="px-5 py-2.5 text-sm font-semibold bg-[#207fdf] text-white rounded-lg hover:bg-[#1a6bc4] disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
                            >
                                Продолжить →
                            </button>
                        </div>
                    </>
                )}
                {step === 2 && (
                    <Step2Mapping
                        headers={headers}
                        mapping={mapping}
                        score={score}
                        branches={branches}
                        branchId={branchId}
                        grade={grade}
                        academicYear={academicYear}
                        onMappingChange={setMapping}
                        onConfigChange={handleConfigChange}
                        onNext={goToStep3}
                        onBack={() => setStep(1)}
                    />
                )}
                {step === 3 && (
                    <Step3Preview
                        rows={validated}
                        allRows={rawRows}
                        mapping={mapping}
                        onNext={() => setStep(4)}
                        onBack={() => setStep(2)}
                    />
                )}
                {step === 4 && (
                    <Step4Import
                        validCount={validCount}
                        onImport={handleImport}
                        onBack={() => setStep(3)}
                        onReset={reset}
                    />
                )}
            </div>
        </div>
    );
}
