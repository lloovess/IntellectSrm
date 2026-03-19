"use client";

import { useState, useTransition, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { KZ_ACADEMIC_MONTHS } from "@/lib/validators/contract.schema";
import { renewContractAction } from "@/lib/actions/renewal.actions";

// ─── Types ────────────────────────────────────────────────────────────────────

interface RenewalWizardProps {
    studentId: string;
    studentName: string;
    branchId?: string;
    /** Current active contract info for the summary step */
    currentContract: {
        contractNumber: string;
        grade: string | null;
        academicYear: string | null;
        totalPaid: number;
        totalExpected: number;
        paymentItems?: {
            amountExpected: number;
            amountPaid: number;
            dueDate: Date | string;
            status: string;
        }[];
    } | null;
    /** Whether the dialog opens immediately (e.g. from ?action=renew URL param) */
    autoOpen?: boolean;
    onSuccess?: (contractId: string) => void;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmt = (n: number) => n.toLocaleString("ru-RU", { maximumFractionDigits: 0 }) + " сом";

const STEPS = [
    { id: 1, label: "Текущий договор" },
    { id: 2, label: "Новое зачисление" },
    { id: 3, label: "Параметры" },
    { id: 4, label: "Предпросмотр" },
    { id: 5, label: "Подтверждение" },
];

function calcPreviewItems(
    basePrice: number,
    discountPercent: number,
    prepayPercent: number,
    months: number,
    startDate: string,
    paymentDueDay: number
) {
    if (basePrice <= 0 || months <= 0) return [];
    const afterDiscount = basePrice * (1 - discountPercent / 100);
    const prepay = afterDiscount * (prepayPercent / 100);
    const remainder = afterDiscount - prepay;
    const monthly = months > 0 ? remainder / months : remainder;

    const sd = new Date(startDate);
    const startYear = sd.getFullYear();
    const startMonthIdx = KZ_ACADEMIC_MONTHS.findIndex((m) => m.month === sd.getMonth() + 1);
    const from = startMonthIdx >= 0 ? startMonthIdx : 0;
    const sliced = KZ_ACADEMIC_MONTHS.slice(from, from + months);
    const allMonths =
        sliced.length < months
            ? [...sliced, ...KZ_ACADEMIC_MONTHS.slice(0, months - sliced.length)]
            : sliced;

    const items: { label: string; amount: number; dueDate: string }[] = [];
    if (prepay > 0) {
        items.push({ label: "Предоплата", amount: Math.round(prepay), dueDate: startDate });
    }

    let accrued = 0;
    allMonths.forEach((m, idx) => {
        const year = m.month < 9 ? startYear + 1 : startYear;

        const expectedDate = new Date(year, m.month - 1, paymentDueDay);
        const safeDueDate = expectedDate.getMonth() === m.month - 1
            ? expectedDate
            : new Date(year, m.month, 0);

        const dueDate = `${safeDueDate.getFullYear()}-${String(safeDueDate.getMonth() + 1).padStart(2, "0")}-${String(safeDueDate.getDate()).padStart(2, "0")}`;

        const isLast = idx === allMonths.length - 1;
        const amount = isLast ? Math.max(0, remainder - accrued) : Math.round(monthly);
        accrued += amount;
        items.push({ label: m.label, amount, dueDate });
    });
    return items;
}

// ─── Step components ──────────────────────────────────────────────────────────

function StepIndicator({ current }: { current: number }) {
    return (
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
            {STEPS.map((step, i) => {
                const done = step.id < current;
                const active = step.id === current;
                return (
                    <div key={step.id} className="flex items-center gap-1.5 flex-1">
                        <div
                            className={`flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold shrink-0 transition-all
                                ${done ? "bg-emerald-500 text-white" :
                                    active ? "bg-[#207fdf] text-white ring-4 ring-[#207fdf]/20" :
                                        "bg-slate-100 dark:bg-slate-800 text-slate-400"}`}
                        >
                            {done ? (
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                </svg>
                            ) : step.id}
                        </div>
                        <span className={`text-xs font-medium hidden sm:block truncate
                            ${active ? "text-[#207fdf]" : done ? "text-emerald-600 dark:text-emerald-400" : "text-slate-400"}`}>
                            {step.label}
                        </span>
                        {i < STEPS.length - 1 && (
                            <div className={`h-px flex-1 mx-1 ${done ? "bg-emerald-400" : "bg-slate-200 dark:bg-slate-700"}`} />
                        )}
                    </div>
                );
            })}
        </div>
    );
}

function FieldGroup({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                {label}
            </label>
            {children}
        </div>
    );
}

const INPUT_CLS =
    "w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2.5 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#207fdf]/60 transition-all";

// ─── Main wizard ──────────────────────────────────────────────────────────────

export function RenewalWizardDialog({
    studentId,
    studentName,
    branchId,
    currentContract,
    autoOpen = false,
    onSuccess,
}: RenewalWizardProps) {
    const router = useRouter();
    const [open, setOpen] = useState(autoOpen);
    const [step, setStep] = useState(1);
    const [isPending, startTransition] = useTransition();
    const [error, setError] = useState<string | null>(null);

    // Step 2 — New enrollment
    // We use actual relationships
    const [academicYearId, setAcademicYearId] = useState("");
    const [classId, setClassId] = useState("");
    
    // Types from DB
    type AcademicYear = { id: string; name: string; status: string };
    type Class = { id: string; name: string; capacity: number; currentEnrollment: number; status: string };

    const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
    const [classes, setClasses] = useState<Class[]>([]);
    const [selectedAcademicYearName, setSelectedAcademicYearName] = useState("");
    const [selectedClassName, setSelectedClassName] = useState("");

    // Load academic years on mount
    useEffect(() => {
        const fetchAcademicYears = async () => {
            try {
                const response = await fetch("/api/academic-years");
                const data = await response.json();
                setAcademicYears(data.data || []);
            } catch (error) {
                console.error("Failed to load academic years:", error);
            }
        };
        fetchAcademicYears();
    }, []);

    // Load classes when academic year or branch changes
    useEffect(() => {
        const fetchClasses = async () => {
            if (!academicYearId || !branchId) {
                setClasses([]);
                return;
            }
            try {
                const url = new URL("/api/classes", window.location.origin);
                url.searchParams.append("branchId", branchId);
                url.searchParams.append("academicYearId", academicYearId);
                const response = await fetch(url.toString());
                const data = await response.json();
                setClasses(data.data || []);
            } catch (error) {
                console.error("Failed to load classes:", error);
            }
        };
        fetchClasses();
    }, [academicYearId, branchId]);

    // Keep names in sync for preview
    useEffect(() => {
        const ay = academicYears.find(y => y.id === academicYearId);
        setSelectedAcademicYearName(ay?.name || "");
    }, [academicYearId, academicYears]);

    useEffect(() => {
        const cls = classes.find(c => c.id === classId);
        setSelectedClassName(cls?.name || "");
    }, [classId, classes]);

    // Step 3 — Contract params
    const [contractNumber, setContractNumber] = useState("");
    const [basePrice, setBasePrice] = useState(150000);
    const [discountPercent, setDiscountPercent] = useState(0);
    const [prepayPercent, setPrepayPercent] = useState(0);
    const [months, setMonths] = useState(9);
    const nextYear = new Date().getFullYear();
    const [startDate, setStartDate] = useState(`${nextYear}-09-01`);
    const [paymentDueDay, setPaymentDueDay] = useState(1);

    // Live preview
    const preview = useMemo(
        () => calcPreviewItems(basePrice, discountPercent, prepayPercent, months, startDate, paymentDueDay),
        [basePrice, discountPercent, prepayPercent, months, startDate, paymentDueDay]
    );
    const totalPreview = preview.reduce((s, p) => s + p.amount, 0);

    const carryDebt = useMemo(() => {
        if (!currentContract?.paymentItems) return 0;

        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);

        let debt = 0;
        for (const item of currentContract.paymentItems) {
            if (["planned", "overdue", "partially_paid"].includes(item.status)) {
                debt += (item.amountExpected - item.amountPaid);
            }
        }
        return Math.max(0, debt);
    }, [currentContract, startDate]);

    function close() {
        setOpen(false);
        setStep(1);
        setError(null);
        // Remove ?action=renew from URL without full reload
        const url = new URL(window.location.href);
        url.searchParams.delete("action");
        router.replace(url.pathname + url.search);
    }

    function next() {
        setError(null);
        setStep((s) => Math.min(s + 1, 5));
    }
    function back() {
        setError(null);
        setStep((s) => Math.max(s - 1, 1));
    }

    function handleSubmit() {
        setError(null);
        startTransition(async () => {
            const result = await renewContractAction({
                studentId,
                classId,
                basePrice,
                discountPercent,
                prepayPercent,
                months,
                startDate,
                paymentDueDay,
                contractNumber,
            });
            if (result.ok) {
                close();
                onSuccess?.(result.data.contractId);
                router.refresh();
            } else {
                setError(result.error);
            }
        });
    }

    const modal = open ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="w-full max-w-2xl max-h-[90vh] flex flex-col rounded-2xl bg-white dark:bg-slate-900 shadow-2xl border border-slate-200 dark:border-slate-700">
                {/* Header */}
                <div className="flex items-center justify-between px-6 pt-5 pb-4">
                    <div>
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                            Продление договора
                        </h2>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                            {studentName}
                        </p>
                    </div>
                    <button
                        onClick={close}
                        className="p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Step indicator */}
                <StepIndicator current={step} />

                {/* Body */}
                <div className="flex-1 overflow-y-auto p-6 space-y-5">
                    {error && (
                        <div className="rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 px-4 py-3 text-sm text-red-700 dark:text-red-400">
                            {error}
                        </div>
                    )}

                    {/* ── Step 1: Current contract summary ── */}
                    {step === 1 && (
                        <div className="space-y-4">
                            <div className="rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
                                <div className="bg-slate-50 dark:bg-slate-800/50 px-5 py-3 border-b border-slate-200 dark:border-slate-700">
                                    <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                                        Текущий договор
                                    </p>
                                </div>
                                {currentContract ? (
                                    <div className="px-5 py-4 space-y-3">
                                        <div className="flex justify-between text-sm">
                                            <span className="text-slate-500">Номер</span>
                                            <span className="font-semibold text-slate-900 dark:text-white">
                                                {currentContract.contractNumber}
                                            </span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span className="text-slate-500">Учебный год</span>
                                            <span className="font-semibold text-slate-900 dark:text-white">
                                                {currentContract.academicYear ?? "—"}
                                            </span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span className="text-slate-500">Класс</span>
                                            <span className="font-semibold text-slate-900 dark:text-white">
                                                {currentContract.grade ?? "—"}
                                            </span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span className="text-slate-500">Оплачено</span>
                                            <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                                                {fmt(currentContract.totalPaid)}
                                            </span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span className="text-slate-500">Ожидалось</span>
                                            <span className="font-semibold text-slate-900 dark:text-white">
                                                {fmt(currentContract.totalExpected)}
                                            </span>
                                        </div>
                                    </div>
                                ) : (
                                    <p className="px-5 py-4 text-sm text-slate-500">
                                        Нет активного договора. Продолжите, чтобы создать новый.
                                    </p>
                                )}
                            </div>

                            {carryDebt > 0 && (
                                <div className="rounded-xl border border-amber-200 dark:border-amber-700/50 bg-amber-50 dark:bg-amber-900/20 px-5 py-4">
                                    <div className="flex items-start gap-3">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                                        </svg>
                                        <div>
                                            <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">
                                                Перенесённый долг: {fmt(carryDebt)}
                                            </p>
                                            <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                                                Эта сумма будет добавлена к первому платежу нового договора
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div className="rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700/50 px-5 py-4">
                                <p className="text-sm text-blue-800 dark:text-blue-300">
                                    При продлении текущий договор и зачисление будут закрыты, и создадутся новые с привязкой к предыдущему договору.
                                </p>
                            </div>
                        </div>
                    )}

                    {/* ── Step 2: New enrollment ── */}
                    {step === 2 && (
                        <div className="space-y-4">
                            <FieldGroup label="Новый учебный год *">
                                <select
                                    value={academicYearId}
                                    onChange={(e) => {
                                        setAcademicYearId(e.target.value);
                                        setClassId(""); // Reset class when year changes
                                    }}
                                    required
                                    className={`${INPUT_CLS} ${!academicYearId ? "text-slate-400" : ""}`}
                                >
                                    <option value="" disabled>-- Выберите учебный год --</option>
                                    {academicYears.map((ay) => (
                                        <option key={ay.id} value={ay.id}>
                                            {ay.name} {ay.status === "archived" ? "(Архив)" : ""}
                                        </option>
                                    ))}
                                </select>
                            </FieldGroup>

                            <FieldGroup label="Новый класс/группа *">
                                <select
                                    value={classId}
                                    onChange={(e) => setClassId(e.target.value)}
                                    required
                                    disabled={!academicYearId || classes.length === 0}
                                    className={`${INPUT_CLS} ${!classId ? "text-slate-400" : ""}`}
                                >
                                    <option value="" disabled>-- Выберите класс --</option>
                                    {classes.map((c) => {
                                        const isFull = c.currentEnrollment >= c.capacity;
                                        return (
                                            <option key={c.id} value={c.id} disabled={isFull}>
                                                {c.name} ({c.currentEnrollment}/{c.capacity} мест){isFull ? " - Полный" : ""}
                                            </option>
                                        );
                                    })}
                                </select>
                                <p className="mt-1 text-xs text-slate-400">
                                    {currentContract?.grade
                                        ? `Текущий класс: ${currentContract.grade}`
                                        : "Укажите класс для нового зачисления"}
                                </p>
                            </FieldGroup>
                        </div>
                    )}

                    {/* ── Step 3: Contract params ── */}
                    {step === 3 && (
                        <div className="space-y-4">
                            <FieldGroup label="Номер нового договора *">
                                <input
                                    type="text"
                                    value={contractNumber}
                                    onChange={(e) => setContractNumber(e.target.value)}
                                    placeholder="Например: 35-26"
                                    required
                                    className={INPUT_CLS}
                                />
                            </FieldGroup>

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                <FieldGroup label="Базовая цена (сом) *">
                                    <input
                                        type="number"
                                        value={basePrice}
                                        onChange={(e) => setBasePrice(Number(e.target.value))}
                                        min={1}
                                        required
                                        className={INPUT_CLS}
                                    />
                                </FieldGroup>
                                <FieldGroup label="Скидка (%)">
                                    <input
                                        type="number"
                                        value={discountPercent}
                                        onChange={(e) => setDiscountPercent(Number(e.target.value))}
                                        min={0}
                                        max={100}
                                        className={INPUT_CLS}
                                    />
                                </FieldGroup>
                                <FieldGroup label="Предоплата (%)">
                                    <input
                                        type="number"
                                        value={prepayPercent}
                                        onChange={(e) => setPrepayPercent(Number(e.target.value))}
                                        min={0}
                                        max={100}
                                        className={INPUT_CLS}
                                    />
                                </FieldGroup>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                <FieldGroup label="Количество месяцев">
                                    <select
                                        value={months}
                                        onChange={(e) => setMonths(Number(e.target.value))}
                                        className={INPUT_CLS}
                                    >
                                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((n) => (
                                            <option key={n} value={n}>{n} мес.</option>
                                        ))}
                                    </select>
                                </FieldGroup>
                                <FieldGroup label="Дата начала">
                                    <input
                                        type="date"
                                        value={startDate}
                                        onChange={(e) => setStartDate(e.target.value)}
                                        className={INPUT_CLS}
                                    />
                                </FieldGroup>
                                <FieldGroup label="День оплаты">
                                    <input
                                        type="number"
                                        value={paymentDueDay}
                                        onChange={(e) => setPaymentDueDay(Number(e.target.value))}
                                        min={1}
                                        max={31}
                                        className={INPUT_CLS}
                                    />
                                </FieldGroup>
                            </div>
                        </div>
                    )}

                    {/* ── Step 4: Live preview ── */}
                    {step === 4 && (
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                {[
                                    { label: "Базовая цена", value: fmt(basePrice) },
                                    {
                                        label: "После скидки",
                                        value: fmt(basePrice * (1 - discountPercent / 100)),
                                    },
                                    {
                                        label: "Предоплата",
                                        value: fmt(
                                            basePrice * (1 - discountPercent / 100) * (prepayPercent / 100)
                                        ),
                                    },
                                    { label: "Итого к оплате", value: fmt(totalPreview) },
                                ].map((kpi) => (
                                    <div
                                        key={kpi.label}
                                        className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-3"
                                    >
                                        <p className="text-xs text-slate-500 mb-1">{kpi.label}</p>
                                        <p className="text-sm font-bold text-slate-900 dark:text-white">{kpi.value}</p>
                                    </div>
                                ))}
                            </div>

                            {carryDebt > 0 && (
                                <div className="text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 rounded-lg px-4 py-2.5 border border-amber-200 dark:border-amber-700/50">
                                    + перенесённый долг {fmt(carryDebt)} будет добавлен к первому платежу
                                </div>
                            )}

                            <div className="rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
                                <div className="bg-slate-50 dark:bg-slate-800/50 px-4 py-2.5 flex justify-between items-center border-b border-slate-200 dark:border-slate-700">
                                    <p className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                                        График платежей
                                    </p>
                                    <p className="text-xs font-bold text-[#207fdf]">
                                        Итого: {fmt(totalPreview)}
                                    </p>
                                </div>
                                <div className="max-h-52 overflow-y-auto">
                                    <table className="w-full text-xs">
                                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                            {preview.map((p, i) => (
                                                <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                                    <td className="px-4 py-2 text-slate-600 dark:text-slate-400">{p.label}</td>
                                                    <td className="px-4 py-2 text-slate-400 dark:text-slate-500">
                                                        {new Date(p.dueDate).toLocaleDateString("ru-RU", {
                                                            day: "numeric",
                                                            month: "short",
                                                            year: "numeric",
                                                        })}
                                                    </td>
                                                    <td className="px-4 py-2 text-right font-semibold text-slate-900 dark:text-white">
                                                        {fmt(p.amount)}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ── Step 5: Confirmation ── */}
                    {step === 5 && (
                        <div className="space-y-4">
                            <div className="rounded-xl border border-emerald-200 dark:border-emerald-700/50 bg-emerald-50 dark:bg-emerald-900/20 px-5 py-4">
                                <div className="flex items-start gap-3">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    <div>
                                        <p className="text-sm font-semibold text-emerald-800 dark:text-emerald-300">
                                            Всё готово к продлению
                                        </p>
                                        <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1">
                                            Нажмите «Продлить договор» для сохранения
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Summary table */}
                            <div className="rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
                                <div className="bg-slate-50 dark:bg-slate-800/50 px-5 py-3 border-b border-slate-200 dark:border-slate-700">
                                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Итоговые параметры</p>
                                </div>
                                <div className="px-5 py-4 space-y-3">
                                    {[
                                        { label: "Ученик", value: studentName },
                                        { label: "Новый договор №", value: contractNumber },
                                        { label: "Учебный год", value: selectedAcademicYearName },
                                        { label: "Класс", value: selectedClassName },
                                        { label: "Базовая цена", value: fmt(basePrice) },
                                        ...(discountPercent > 0
                                            ? [{ label: "Скидка", value: `${discountPercent}%` }]
                                            : []),
                                        ...(prepayPercent > 0
                                            ? [{ label: "Предоплата", value: `${prepayPercent}%` }]
                                            : []),
                                        { label: "Месяцы", value: `${months} мес.` },
                                        { label: "Дата начала", value: new Date(startDate).toLocaleDateString("ru-RU") },
                                        { label: "Итого к оплате", value: fmt(totalPreview) },
                                        ...(carryDebt > 0
                                            ? [{ label: "Перенесённый долг", value: fmt(carryDebt) }]
                                            : []),
                                    ].map((row) => (
                                        <div key={row.label} className="flex justify-between text-sm">
                                            <span className="text-slate-500">{row.label}</span>
                                            <span className="font-semibold text-slate-900 dark:text-white">{row.value}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer navigation */}
                <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
                    <button
                        type="button"
                        onClick={step === 1 ? close : back}
                        className="px-5 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    >
                        {step === 1 ? "Отмена" : "← Назад"}
                    </button>

                    {step < 5 ? (
                        <button
                            type="button"
                            onClick={() => {
                                // Simple validation per step
                                if (step === 2 && (!academicYearId || !classId)) {
                                    setError("Выберите учебный год и класс");
                                    return;
                                }
                                if (step === 3 && (!contractNumber.trim() || basePrice <= 0)) {
                                    setError("Укажите номер договора и базовую цену");
                                    return;
                                }
                                next();
                            }}
                            className="px-5 py-2.5 rounded-lg bg-[#207fdf] text-sm font-semibold text-white hover:bg-[#1a6bc4] transition-colors shadow-sm shadow-blue-500/20"
                        >
                            Далее →
                        </button>
                    ) : (
                        <button
                            type="button"
                            onClick={handleSubmit}
                            disabled={isPending}
                            className="px-5 py-2.5 rounded-lg bg-emerald-600 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm shadow-emerald-500/20"
                        >
                            {isPending ? (
                                <span className="flex items-center gap-2">
                                    <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                    </svg>
                                    Сохранение…
                                </span>
                            ) : (
                                "✓ Продлить договор"
                            )}
                        </button>
                    )}
                </div>
            </div>
        </div>
    ) : null;

    return (
        <>
            <button
                onClick={() => { setOpen(true); setStep(1); }}
                className="flex items-center gap-2 rounded-lg bg-violet-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-violet-700 shadow-sm shadow-violet-500/20 transition-colors"
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Продлить договор
            </button>
            {modal}
        </>
    );
}
