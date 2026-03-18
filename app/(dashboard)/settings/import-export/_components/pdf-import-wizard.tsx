"use client";

import { useState, useEffect } from "react";
import { type PdfParsedData } from "@/lib/import/pdf";
import { Loader2, UploadCloud, AlertCircle, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import { ImportResult } from "@/lib/import/csv";

interface Class {
    id: string;
    name: string;
    capacity: number;
    currentEnrollment: number;
}

interface AcademicYear {
    id: string;
    name: string;
}

interface PdfImportWizardProps {
    branches: { id: string; name: string }[];
    defaultAcademicYear: string;
}

const STEP_LABELS = ["Загрузка файла", "Распознавание ИИ", "Проверка данных", "Импорт"];

export function PdfImportWizard({ branches, defaultAcademicYear }: PdfImportWizardProps) {
    const [step, setStep] = useState(1);
    const [file, setFile] = useState<File | null>(null);
    const [parsedData, setParsedData] = useState<PdfParsedData | null>(null);
    const [isParsing, setIsParsing] = useState(false);
    const [isImporting, setIsImporting] = useState(false);
    const [isLoadingClasses, setIsLoadingClasses] = useState(false);

    // Form states for step 3
    const [formData, setFormData] = useState<PdfParsedData | null>(null);
    const [branchId, setBranchId] = useState("");
    const [classId, setClassId] = useState("");
    const [academicYearId, setAcademicYearId] = useState("");
    const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
    const [classes, setClasses] = useState<Class[]>([]);
    const [selectedClass, setSelectedClass] = useState<Class | null>(null);

    // Load academic years on mount
    useEffect(() => {
        const fetchAcademicYears = async () => {
            try {
                const response = await fetch("/api/academic-years");
                const data = await response.json();
                setAcademicYears(data.data || []);
                // Set default year if available
                const defaultYear = data.data?.find(
                    (y: AcademicYear) => y.name === defaultAcademicYear
                );
                if (defaultYear) {
                    setAcademicYearId(defaultYear.id);
                }
            } catch (error) {
                console.error("Failed to load academic years:", error);
                toast.error("Не удалось загрузить учебные годы");
            }
        };
        fetchAcademicYears();
    }, [defaultAcademicYear]);

    // Load classes when branch or year changes
    useEffect(() => {
        if (!branchId || !academicYearId) {
            setClasses([]);
            setClassId("");
            setSelectedClass(null);
            return;
        }

        const fetchClasses = async () => {
            setIsLoadingClasses(true);
            try {
                const response = await fetch(
                    `/api/classes?branchId=${branchId}&academicYearId=${academicYearId}`
                );
                const data = await response.json();
                setClasses(data.data || []);
            } catch (error) {
                console.error("Failed to load classes:", error);
                toast.error("Не удалось загрузить классы");
            } finally {
                setIsLoadingClasses(false);
            }
        };

        fetchClasses();
    }, [branchId, academicYearId]);

    // Update selected class when classId changes
    useEffect(() => {
        const selected = classes.find((c) => c.id === classId);
        setSelectedClass(selected || null);
    }, [classId, classes]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            setFile(e.target.files[0]);
        }
    };

    const handleParse = async () => {
        if (!file) return;
        setIsParsing(true);
        try {
            const formData = new FormData();
            formData.append("file", file);

            const res = await fetch("/api/import/pdf", {
                method: "POST",
                body: formData
            });

            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error || "Ошибка парсинга документа");
            }

            const data = (await res.json()) as PdfParsedData;
            setParsedData(data);
            setFormData(data);
            setStep(3); // skip step 2 as it's just a loading state
        } catch (error) {
            console.error(error);
            toast.error(error instanceof Error ? error.message : "Не удалось распознать документ");
        } finally {
            setIsParsing(false);
        }
    };

    const handleImport = async () => {
        if (!formData || !branchId || !classId || !academicYearId) {
            toast.error("Пожалуйста, заполните все обязательные поля");
            return;
        }

        // Check capacity
        if (
            selectedClass &&
            selectedClass.currentEnrollment >= selectedClass.capacity
        ) {
            toast.error(
                `Класс "${selectedClass.name}" полный (${selectedClass.currentEnrollment}/${selectedClass.capacity})`
            );
            return;
        }

        setIsImporting(true);
        try {
            const res = await fetch("/api/import/pdf/execute", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    branchId,
                    classId,
                    academicYearId,
                    parsedData: formData,
                }),
            });

            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error || "Ошибка импорта");
            }

            const result = (await res.json()) as ImportResult;
            if (result.errors.length > 0) {
                toast.error(`Ошибка при создании ученика: ${result.errors[0].error}`);
            } else {
                toast.success(`Успешно импортирован 1 договор!`);
                setStep(1);
                setFile(null);
                setFormData(null);
                setParsedData(null);
            }
        } catch (error) {
            console.error(error);
            toast.error(
                error instanceof Error ? error.message : "Ошибка импорта"
            );
        } finally {
            setIsImporting(false);
        }
    };

    return (
        <div className="space-y-8">
            {/* Step indicator */}
            <div className="relative">
                <div className="absolute top-5 left-0 right-0 h-0.5 bg-slate-200 dark:bg-slate-700" />
                <div
                    className="absolute top-5 left-0 h-0.5 bg-[#207fdf] transition-all duration-500"
                    style={{ width: `${((step - 1) / (STEP_LABELS.length - 1)) * 100}%` }}
                />
                <div className="relative grid grid-cols-4 gap-4">
                    {STEP_LABELS.map((label, i) => {
                        const n = i + 1;
                        const isComplete = step > n;
                        const isCurrent = step === n;
                        return (
                            <div key={n} className="flex flex-col items-center gap-2">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ring-4 ring-white dark:ring-slate-950 z-10 transition-colors ${isComplete || isCurrent ? "bg-[#207fdf] text-white" : "bg-slate-200 dark:bg-slate-700 text-slate-500"}`}>
                                    {isComplete ? (
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                        </svg>
                                    ) : n}
                                </div>
                                <span className={`text-xs font-semibold text-center ${isCurrent || isComplete ? "text-[#207fdf]" : "text-slate-400"}`}>
                                    {label}
                                </span>
                            </div>
                        );
                    })}
                </div>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
                {step === 1 && (
                    <div className="space-y-6">
                        <div className="border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl p-8 flex flex-col items-center justify-center text-center bg-slate-50 dark:bg-slate-900/50 hover:bg-slate-100 dark:hover:bg-slate-800/50 transition-colors cursor-pointer relative">
                            <input
                                type="file"
                                accept=".pdf,.docx"
                                onChange={handleFileChange}
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            />
                            <div className="w-12 h-12 bg-[#207fdf]/10 text-[#207fdf] rounded-full flex items-center justify-center mb-4">
                                <UploadCloud className="w-6 h-6" />
                            </div>
                            <p className="text-sm font-semibold text-slate-900 dark:text-white mb-1">
                                Нажмите или перетащите PDF / DOCX сюда
                            </p>
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                                {file ? `Выбран файл: ${file.name}` : "Вы можете загрузить скан или электронный договор (PDF / DOCX)"}
                            </p>
                        </div>

                        <div className="flex justify-end mt-6">
                            <button
                                disabled={!file || isParsing}
                                onClick={handleParse}
                                className="px-5 py-2.5 text-sm font-semibold bg-[#207fdf] text-white rounded-lg hover:bg-[#1a6bc4] disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm flex items-center gap-2"
                            >
                                {isParsing ? <><Loader2 className="w-4 h-4 animate-spin" /> Распознавание...</> : "Распознать через ИИ →"}
                            </button>
                        </div>
                    </div>
                )}

                {step === 3 && formData && (
                    <div className="space-y-6">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <label className="text-xs font-semibold text-slate-500 uppercase">ФИО ученика</label>
                                <input type="text" value={formData.fullName} onChange={e => setFormData({ ...formData, fullName: e.target.value })} className="w-full px-3 py-2 border rounded-lg dark:bg-slate-800 dark:border-slate-700" />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-semibold text-slate-500 uppercase">ФИО родителя</label>
                                <input type="text" value={formData.parentName || ""} onChange={e => setFormData({ ...formData, parentName: e.target.value })} className="w-full px-3 py-2 border rounded-lg dark:bg-slate-800 dark:border-slate-700" />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-semibold text-slate-500 uppercase">Телефон родителя</label>
                                <input type="text" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} className="w-full px-3 py-2 border rounded-lg dark:bg-slate-800 dark:border-slate-700" />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-semibold text-slate-500 uppercase">Номер договора</label>
                                <input type="text" value={formData.contractNumber} onChange={e => setFormData({ ...formData, contractNumber: e.target.value })} className="w-full px-3 py-2 border rounded-lg dark:bg-slate-800 dark:border-slate-700" />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-semibold text-slate-500 uppercase">Базовая сумма (тг)</label>
                                <input type="number" value={formData.basePrice} onChange={e => setFormData({ ...formData, basePrice: Number(e.target.value) })} className="w-full px-3 py-2 border rounded-lg dark:bg-slate-800 dark:border-slate-700" />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-semibold text-slate-500 uppercase">Оплата в мес (тг)</label>
                                <input type="number" value={formData.monthlyAmount} onChange={e => setFormData({ ...formData, monthlyAmount: Number(e.target.value) })} className="w-full px-3 py-2 border rounded-lg dark:bg-slate-800 dark:border-slate-700" />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-semibold text-slate-500 uppercase">Первый взнос (тг)</label>
                                <input type="number" value={formData.prepayment} onChange={e => setFormData({ ...formData, prepayment: Number(e.target.value) })} className="w-full px-3 py-2 border rounded-lg dark:bg-slate-800 dark:border-slate-700" />
                            </div>
                        </div>

                        <div className="border-t pt-4 space-y-4">
                            <div className="grid grid-cols-3 gap-4">
                                <div className="space-y-1">
                                    <label className="text-xs font-semibold text-slate-500 uppercase">
                                        Филиал
                                    </label>
                                    <select
                                        value={branchId}
                                        onChange={(e) => setBranchId(e.target.value)}
                                        className="w-full px-3 py-2 border rounded-lg dark:bg-slate-800 dark:border-slate-700 text-sm"
                                    >
                                        <option value="">Выберите...</option>
                                        {branches.map((b) => (
                                            <option key={b.id} value={b.id}>
                                                {b.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-semibold text-slate-500 uppercase">
                                        Уч. год
                                    </label>
                                    <select
                                        value={academicYearId}
                                        onChange={(e) => setAcademicYearId(e.target.value)}
                                        className="w-full px-3 py-2 border rounded-lg dark:bg-slate-800 dark:border-slate-700 text-sm"
                                    >
                                        <option value="">Выберите...</option>
                                        {academicYears.map((y) => (
                                            <option key={y.id} value={y.id}>
                                                {y.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-semibold text-slate-500 uppercase">
                                        Класс
                                    </label>
                                    <select
                                        value={classId}
                                        onChange={(e) => setClassId(e.target.value)}
                                        disabled={isLoadingClasses || !branchId || !academicYearId}
                                        className="w-full px-3 py-2 border rounded-lg dark:bg-slate-800 dark:border-slate-700 text-sm disabled:opacity-50"
                                    >
                                        <option value="">
                                            {isLoadingClasses
                                                ? "Загрузка..."
                                                : "Выберите..."}
                                        </option>
                                        {classes.map((c) => (
                                            <option key={c.id} value={c.id}>
                                                {c.name} ({c.currentEnrollment}/{c.capacity})
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {/* Capacity Info */}
                            {selectedClass && (
                                <div
                                    className={`p-3 rounded-lg flex items-start gap-3 ${
                                        selectedClass.currentEnrollment >=
                                        selectedClass.capacity
                                            ? "bg-red-100 dark:bg-red-900/30"
                                            : "bg-green-100 dark:bg-green-900/30"
                                    }`}
                                >
                                    {selectedClass.currentEnrollment >=
                                    selectedClass.capacity ? (
                                        <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                                    ) : (
                                        <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                                    )}
                                    <div className="text-sm">
                                        <p className="font-semibold text-slate-900 dark:text-white">
                                            Класс {selectedClass.name}
                                        </p>
                                        <p className="text-slate-700 dark:text-slate-300">
                                            Занято мест:{" "}
                                            <span className="font-semibold">
                                                {selectedClass.currentEnrollment}/
                                                {selectedClass.capacity}
                                            </span>
                                        </p>
                                        {selectedClass.currentEnrollment >=
                                        selectedClass.capacity ? (
                                            <p className="text-red-600 dark:text-red-400 font-semibold mt-1">
                                                Класс полный! Импорт невозможен.
                                            </p>
                                        ) : (
                                            <p className="text-green-600 dark:text-green-400 mt-1">
                                                Доступно:{" "}
                                                <span className="font-semibold">
                                                    {selectedClass.capacity -
                                                        selectedClass.currentEnrollment}
                                                </span>{" "}
                                                мест
                                            </p>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="flex justify-between mt-6">
                            <button
                                onClick={() => setStep(1)}
                                className="px-5 py-2.5 text-sm font-semibold rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors border border-slate-200 dark:border-slate-700"
                            >
                                Назад
                            </button>
                            <button
                                onClick={() => setStep(4)}
                                disabled={
                                    !branchId ||
                                    !classId ||
                                    !formData.fullName ||
                                    !formData.phone ||
                                    (selectedClass &&
                                        selectedClass.currentEnrollment >=
                                            selectedClass.capacity)
                                }
                                className="px-5 py-2.5 text-sm font-semibold bg-[#207fdf] text-white rounded-lg hover:bg-[#1a6bc4] disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
                            >
                                Все верно, далее →
                            </button>
                        </div>
                    </div>
                )}

                {step === 4 && formData && (
                    <div className="space-y-6 text-center py-6">
                        <div className="inline-flex w-16 h-16 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-full items-center justify-center mb-2">
                            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                        <h3 className="text-lg font-bold">Данные готовы к импорту</h3>
                        <p className="text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                            Будет создан ученик {formData.fullName}, договор{" "}
                            {formData.contractNumber || "без номера"} и привязан класс{" "}
                            <span className="font-semibold text-slate-900 dark:text-white">
                                {selectedClass?.name}
                            </span>
                            .
                        </p>
                        <div className="flex justify-center gap-4 mt-6">
                            <button onClick={() => setStep(3)} className="px-5 py-2.5 text-sm font-semibold rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 border dark:border-slate-700">
                                Назад
                            </button>
                            <button
                                disabled={isImporting}
                                onClick={handleImport}
                                className="px-5 py-2.5 text-sm font-semibold bg-[#207fdf] text-white rounded-lg hover:bg-[#1a6bc4] disabled:opacity-50 transition-colors shadow-sm flex items-center gap-2"
                            >
                                {isImporting ? <><Loader2 className="w-4 h-4 animate-spin" /> Сохранение...</> : "Импортировать"}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
