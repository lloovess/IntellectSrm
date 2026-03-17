"use client";

import { useState, useTransition, useMemo, useEffect } from "react";
import { KZ_ACADEMIC_MONTHS } from "@/lib/validators/contract.schema";
import { createContractAction } from "@/lib/actions/contract.actions";
import type { PdfContractData } from "@/components/pdf/contract-document";
import dynamic from "next/dynamic";

const ContractPdfPreview = dynamic(
    () => import("@/components/pdf/contract-pdf-preview"),
    { ssr: false }
);



const fmt = (n: number) =>
    n.toLocaleString("ru-RU", { maximumFractionDigits: 0 }) + " сом";

interface CreateContractDialogProps {
    studentId: string;
    enrollmentId: string;
    studentName?: string;
    guardians?: {
        id: string;
        fullName: string;
        iin: string | null;
        phone: string | null;
        passport?: string | null;
        address?: string | null;
    }[];
    grade?: string | null;
    onSuccess?: (contractId: string) => void;
}

export function CreateContractDialog({
    studentId,
    enrollmentId,
    studentName,
    guardians,
    grade,
    onSuccess,
}: CreateContractDialogProps) {
    const [open, setOpen] = useState(false);
    const [step, setStep] = useState<1 | 2>(1);
    const [isPending, startTransition] = useTransition();
    const [error, setError] = useState<string | null>(null);

    // Form state - Contract
    const [contractNumber, setContractNumber] = useState("");
    const [basePrice, setBasePrice] = useState(150000);
    const [discountPercent, setDiscountPercent] = useState(0);
    const [prepayPercent, setPrepayPercent] = useState(0);
    const [months, setMonths] = useState(9);
    const [startDate, setStartDate] = useState(`${new Date().getFullYear()}-09-01`);
    const [paymentDueDay, setPaymentDueDay] = useState(1);
    const [paymentMode, setPaymentMode] = useState<"monthly" | "quarterly" | "annual">("monthly");

    // Form state - Guardian
    const [guardianId, setGuardianId] = useState(guardians?.[0]?.id || "");
    const [guardianFullName, setGuardianFullName] = useState("");
    const [guardianIin, setGuardianIin] = useState("");
    const [guardianPassport, setGuardianPassport] = useState("");
    const [guardianAddress, setGuardianAddress] = useState("");
    const [guardianPhone, setGuardianPhone] = useState("");

    // Initialize Guardian state
    useEffect(() => {
        const selected = guardians?.find((g) => g.id === guardianId);
        if (selected) {
            setGuardianFullName(selected.fullName || "");
            setGuardianIin(selected.iin || "");
            setGuardianPhone(selected.phone || "");
            // These might be undefined if passing from an old interface, but we added them to DB
            setGuardianPassport(selected.passport || "");
            setGuardianAddress(selected.address || "");
        }
    }, [guardianId, guardians]);

    // Live preview — calculate plan in browser (mirrors service logic)
    const preview = useMemo<{ label: string; amount: number; dueDate: string }[]>(() => {
        if (basePrice <= 0 || months <= 0) return [];
        const afterDiscount = basePrice * (1 - discountPercent / 100);
        const prepay = afterDiscount * (prepayPercent / 100);
        const remainder = afterDiscount - prepay;
        if (paymentMode === "annual") {
            const annualItems: { label: string; amount: number; dueDate: string }[] = [];
            if (prepay > 0) {
                annualItems.push({ label: "Предоплата", amount: Math.round(prepay), dueDate: startDate });
            }
            if (remainder > 0) {
                annualItems.push({ label: "Полная оплата", amount: Math.round(remainder), dueDate: startDate });
            }
            return annualItems;
        }

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

        const chunkSize = paymentMode === "quarterly" ? 3 : 1;
        const groups: Array<Array<(typeof KZ_ACADEMIC_MONTHS)[number]>> = [];
        for (let i = 0; i < allMonths.length; i += chunkSize) {
            groups.push(allMonths.slice(i, i + chunkSize));
        }
        const groupAmount = groups.length > 0 ? remainder / groups.length : remainder;

        let accrued = 0;
        groups.forEach((group, idx) => {
            const m = group[0];
            const year = m.month < 9 ? startYear + 1 : startYear;

            const expectedDate = new Date(year, m.month - 1, paymentDueDay);
            const safeDueDate = expectedDate.getMonth() === m.month - 1
                ? expectedDate
                : new Date(year, m.month, 0);

            // Format to YYYY-MM-DD for local display without timezone shift
            const dueDate = `${safeDueDate.getFullYear()}-${String(safeDueDate.getMonth() + 1).padStart(2, "0")}-${String(safeDueDate.getDate()).padStart(2, "0")}`;

            const isLast = idx === groups.length - 1;
            const amount = isLast ? Math.max(0, remainder - accrued) : Math.round(groupAmount);
            accrued += amount;
            items.push({ label: paymentMode === "quarterly" ? `Квартал ${idx + 1}` : m.label, amount, dueDate });
        });

        return items;
    }, [basePrice, discountPercent, prepayPercent, months, startDate, paymentDueDay, paymentMode]);

    const totalPreview = preview.reduce((s, p) => s + p.amount, 0);

    const pdfData = useMemo<PdfContractData>(() => {
        return {
            contractNumber: contractNumber || "____",
            contractDate: new Date(startDate),
            studentName: studentName || "Студент",
            guardianName: guardianFullName || "Родитель",
            guardianPassport: guardianPassport || "________________",
            guardianInn: guardianIin || "________________",
            guardianAddress: guardianAddress || "________________",
            guardianPhone: guardianPhone || "________________",
            totalAmount: totalPreview,
            paymentItems: preview.map(p => ({
                dueDate: new Date(p.dueDate),
                amount: p.amount,
                isInitial: p.label === "Предоплата",
            })),
            grade: grade || null,
        };
    }, [contractNumber, startDate, studentName, guardianFullName, guardianPassport, guardianIin, guardianAddress, guardianPhone, totalPreview, preview, grade]);


    function handleNextStep(e: React.FormEvent) {
        e.preventDefault();
        setError(null);
        setStep(2);
    }

    function handleSubmit() {
        setError(null);
        startTransition(async () => {
            const result = await createContractAction({
                contractNumber,
                studentId,
                enrollmentId,
                basePrice,
                discountPercent,
                prepayPercent,
                months,
                startDate,
                paymentDueDay,
                paymentMode,

                // Guardian payload
                guardianId,
                guardianFullName,
                guardianIin,
                guardianPassport,
                guardianAddress,
                guardianPhone,
            });
            if (result.ok) {
                setOpen(false);
                setStep(1);
                onSuccess?.(result.data.contractId);
            } else {
                setError(result.error);
                setStep(1); // Go back to fix error if any
            }
        });
    }

    return (
        <>
            <button
                onClick={() => { setOpen(true); setStep(1); setError(null); }}
                className="flex items-center gap-2 rounded-lg bg-[#207fdf] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#1a6bc4] shadow-sm shadow-blue-500/20 transition-colors"
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
                Создать договор
            </button>

            {open && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                    <div className="w-full max-w-4xl max-h-[90vh] overflow-y-auto mx-4 rounded-2xl bg-white dark:bg-slate-900 shadow-2xl border border-slate-200 dark:border-slate-700 flex flex-col">
                        {/* Modal header */}
                        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 shrink-0">
                            <div className="flex items-center gap-4">
                                <h2 className="text-xl font-bold text-slate-900 dark:text-white">Новый договор</h2>
                                <div className="flex items-center gap-2 text-sm font-medium">
                                    <span className={`px-2 py-1 rounded-md ${step === 1 ? 'bg-blue-100 text-[#207fdf] dark:bg-blue-900/30' : 'text-slate-400'}`}>1. Детали</span>
                                    <span className="text-slate-300">›</span>
                                    <span className={`px-2 py-1 rounded-md ${step === 2 ? 'bg-blue-100 text-[#207fdf] dark:bg-blue-900/30' : 'text-slate-400'}`}>2. Предпросмотр</span>
                                </div>
                            </div>
                            <button
                                onClick={() => setOpen(false)}
                                className="p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        {error && (
                            <div className="m-6 mb-0 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 px-4 py-3 text-sm text-red-700 dark:text-red-400 shrink-0">
                                {error}
                            </div>
                        )}

                        <div className="p-6 overflow-y-auto grow">
                            {step === 1 && (
                                <form id="contract-form" onSubmit={handleNextStep} className="space-y-8">
                                    {/* Contract Details Section */}
                                    <div className="space-y-4">
                                        <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100 border-b border-slate-100 dark:border-slate-800 pb-2">
                                            Условия договора
                                        </h3>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                                                    Номер договора *
                                                </label>
                                                <input
                                                    type="text"
                                                    value={contractNumber}
                                                    onChange={(e) => setContractNumber(e.target.value)}
                                                    placeholder="Например: 35-26"
                                                    required
                                                    className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2.5 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#207fdf]"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                                                    Дата начала
                                                </label>
                                                <input
                                                    type="date"
                                                    value={startDate}
                                                    onChange={(e) => setStartDate(e.target.value)}
                                                    required
                                                    className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2.5 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#207fdf]"
                                                />
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                            <div>
                                                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                                                    Базовая цена (сом) *
                                                </label>
                                                <input
                                                    type="number"
                                                    value={basePrice}
                                                    onChange={(e) => setBasePrice(Number(e.target.value))}
                                                    min={1}
                                                    required
                                                    className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2.5 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#207fdf]"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                                                    Скидка (%)
                                                </label>
                                                <input
                                                    type="number"
                                                    value={discountPercent}
                                                    onChange={(e) => setDiscountPercent(Number(e.target.value))}
                                                    min={0}
                                                    max={100}
                                                    className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2.5 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#207fdf]"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                                                    Предоплата (%)
                                                </label>
                                                <input
                                                    type="number"
                                                    value={prepayPercent}
                                                    onChange={(e) => setPrepayPercent(Number(e.target.value))}
                                                    min={0}
                                                    max={100}
                                                    className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2.5 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#207fdf]"
                                                />
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                                                    Режим оплаты
                                                </label>
                                                <select
                                                    value={paymentMode}
                                                    onChange={(e) => setPaymentMode(e.target.value as "monthly" | "quarterly" | "annual")}
                                                    className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2.5 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#207fdf]"
                                                >
                                                    <option value="monthly">Ежемесячно</option>
                                                    <option value="quarterly">Ежеквартально</option>
                                                    <option value="annual">Разовый платеж</option>
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                                                    Количество месяцев
                                                </label>
                                                <select
                                                    value={months}
                                                    onChange={(e) => setMonths(Number(e.target.value))}
                                                    className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2.5 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#207fdf]"
                                                >
                                                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((n) => (
                                                        <option key={n} value={n}>{n} мес.</option>
                                                    ))}
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                                                    День оплаты
                                                </label>
                                                <input
                                                    type="number"
                                                    value={paymentDueDay}
                                                    onChange={(e) => setPaymentDueDay(Number(e.target.value))}
                                                    min={1}
                                                    max={31}
                                                    className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2.5 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#207fdf]"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Guardian Details Section */}
                                    <div className="space-y-4">
                                        <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100 border-b border-slate-100 dark:border-slate-800 pb-2">
                                            Реквизиты представителя (Опекуна)
                                        </h3>
                                        {guardians && guardians.length > 0 && (
                                            <div>
                                                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                                                    Выберите опекуна
                                                </label>
                                                <select
                                                    value={guardianId}
                                                    onChange={(e) => setGuardianId(e.target.value)}
                                                    className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2.5 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#207fdf]"
                                                >
                                                    <option value="">-- Добавить нового --</option>
                                                    {guardians.map(g => (
                                                        <option key={g.id} value={g.id}>{g.fullName}</option>
                                                    ))}
                                                </select>
                                            </div>
                                        )}

                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                                                    ФИО опекуна *
                                                </label>
                                                <input
                                                    type="text"
                                                    value={guardianFullName}
                                                    onChange={(e) => setGuardianFullName(e.target.value)}
                                                    required
                                                    className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2.5 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#207fdf]"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                                                    Телефон *
                                                </label>
                                                <input
                                                    type="text"
                                                    value={guardianPhone}
                                                    onChange={(e) => setGuardianPhone(e.target.value)}
                                                    required
                                                    className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2.5 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#207fdf]"
                                                />
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                                                    Паспорт (ID / Серия и Номер, кем выдан) *
                                                </label>
                                                <input
                                                    type="text"
                                                    value={guardianPassport}
                                                    onChange={(e) => setGuardianPassport(e.target.value)}
                                                    placeholder="AN0123456, выдан МВД КР 01.01.2020"
                                                    required
                                                    className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2.5 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#207fdf]"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                                                    ИНН *
                                                </label>
                                                <input
                                                    type="text"
                                                    value={guardianIin}
                                                    onChange={(e) => setGuardianIin(e.target.value)}
                                                    placeholder="14 значный ИНН"
                                                    required
                                                    className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2.5 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#207fdf]"
                                                />
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                                                Адрес проживания *
                                            </label>
                                            <input
                                                type="text"
                                                value={guardianAddress}
                                                onChange={(e) => setGuardianAddress(e.target.value)}
                                                placeholder="г. Бишкек, ул. Примерная 1, кв 2"
                                                required
                                                className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2.5 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#207fdf]"
                                            />
                                        </div>
                                    </div>
                                </form>
                            )}

                            {step === 2 && (
                                <div className="space-y-4 h-[60vh] flex flex-col">
                                    <div className="flex items-center justify-between text-sm text-slate-500 mb-2 shrink-0">
                                        <span>Проверьте договор. Вы сможете скачать его после сохранения.</span>
                                        <button
                                            onClick={() => setStep(1)}
                                            className="text-[#207fdf] hover:underline font-medium"
                                        >
                                            ← Назад к редактированию
                                        </button>
                                    </div>
                                    <div className="grow bg-slate-100 dark:bg-slate-800 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700 relative">
                                        <ContractPdfPreview data={pdfData} />
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Actions Footer */}
                        <div className="flex justify-end gap-3 px-6 py-4 border-t border-slate-100 dark:border-slate-800 shrink-0 bg-slate-50/50 dark:bg-slate-800/20">
                            <button
                                type="button"
                                onClick={() => setOpen(false)}
                                className="px-5 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                            >
                                Отмена
                            </button>

                            {step === 1 ? (
                                <button
                                    form="contract-form"
                                    type="submit"
                                    className="px-5 py-2.5 rounded-lg bg-[#207fdf] text-sm font-semibold text-white hover:bg-[#1a6bc4] shadow-sm shadow-blue-500/20 transition-colors"
                                >
                                    Предпросмотр договора
                                </button>
                            ) : (
                                <button
                                    type="button"
                                    onClick={handleSubmit}
                                    disabled={isPending}
                                    className="px-5 py-2.5 rounded-lg bg-[#207fdf] text-sm font-semibold text-white hover:bg-[#1a6bc4] disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm shadow-blue-500/20"
                                >
                                    {isPending ? "Сохранение..." : "Сохранить договор"}
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
