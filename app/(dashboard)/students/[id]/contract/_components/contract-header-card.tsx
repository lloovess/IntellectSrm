import type { ContractDetail, PaymentItemDetail } from "@/lib/db/repositories/contract.repo";
import DownloadContractButton from "@/components/pdf/download-contract-button";
import { ContractActionsMenu } from "./contract-actions-menu";
const STATUS_STYLES: Record<string, { label: string; classes: string }> = {
    active: { label: "Active", classes: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400" },
    completed: { label: "Completed", classes: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" },
    cancelled: { label: "Cancelled", classes: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" },
};

const fmt = (n: number) =>
    n.toLocaleString("ru-RU", { maximumFractionDigits: 0 }) + " сом";

const paymentModeLabel: Record<string, string> = {
    monthly: "Ежемесячно",
    quarterly: "Ежеквартально",
    annual: "Разовый платеж",
};

interface ContractHeaderCardProps {
    contract: ContractDetail;
    basePrice?: number;
    discountPercent?: number;
    canEdit: boolean;
    studentId: string;
    studentName: string;
    guardians: {
        id: string;
        fullName: string;
        iin: string | null;
        phone: string | null;
        passport?: string | null;
        address?: string | null;
    }[];
    grade: string | null;
    paymentItems: PaymentItemDetail[];
}

export function ContractHeaderCard({
    contract,
    basePrice,
    discountPercent = 0,
    canEdit,
    studentId,
    studentName,
    guardians,
    grade,
    paymentItems,
}: ContractHeaderCardProps) {
    const s = STATUS_STYLES[contract.status] ?? STATUS_STYLES.active;
    const startFmt = new Date(contract.startedAt).toLocaleDateString("ru-RU", {
        day: "numeric", month: "short", year: "numeric",
    });

    const primaryGuardian = guardians.find(g => g.fullName) || guardians[0];
    const pdfData = {
        contractNumber: contract.contractNumber || "Б/Н",
        contractDate: new Date(contract.startedAt),
        studentName: studentName,
        guardianName: primaryGuardian?.fullName || "",
        guardianPassport: primaryGuardian?.passport || "________________",
        guardianInn: primaryGuardian?.iin || "________________",
        guardianAddress: primaryGuardian?.address || "________________",
        guardianPhone: primaryGuardian?.phone || "",
        totalAmount: contract.totalAmount,
        paymentItems: paymentItems.map(p => ({
            dueDate: new Date(p.dueDate),
            amount: p.amountExpected,
            isInitial: p.label?.toLowerCase().includes("предоплата") ?? false
        })),
        grade: grade
    };

    return (
        <div className="lg:col-span-2 rounded-2xl bg-white p-6 shadow-sm dark:bg-slate-900 ring-1 ring-slate-200 dark:ring-slate-800 relative overflow-hidden">
            {/* Subtle top decoration */}
            <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-[#207fdf] to-[#409fff]" />
            <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
                <div>
                    <div className="flex items-center gap-3 flex-wrap">
                        <h3 className="text-2xl font-bold text-slate-900 dark:text-white">
                            Договор #{contract.contractNumber}
                        </h3>
                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${s.classes}`}>
                            {s.label}
                        </span>
                    </div>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                        Начало: {startFmt}
                    </p>
                </div>
                <div className="flex gap-3">
                    <DownloadContractButton data={pdfData} />
                    {canEdit ? (
                        <ContractActionsMenu contractId={contract.id} studentId={studentId} />
                    ) : null}
                </div>
            </div>

            {/* Stats grid */}
            <div className="grid grid-cols-2 gap-y-4 gap-x-8 sm:grid-cols-4 border-t border-slate-100 dark:border-slate-800 pt-6">
                <div>
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider dark:text-slate-400">
                        Базовая цена
                    </p>
                    <p className="mt-1 text-lg font-semibold text-slate-900 dark:text-white">
                        {basePrice ? fmt(basePrice) : fmt(contract.totalAmount)}
                    </p>
                </div>
                <div>
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider dark:text-slate-400">
                        Скидка
                    </p>
                    <div className="mt-1">
                        <span className="text-lg font-semibold text-green-600 dark:text-green-400">
                            {discountPercent}%
                        </span>
                    </div>
                </div>
                <div>
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider dark:text-slate-400">
                        Итого к оплате
                    </p>
                    <p className="mt-1 text-2xl font-extrabold tracking-tight text-[#207fdf] drop-shadow-sm">
                        {fmt(contract.totalAmount)}
                    </p>
                </div>
                <div>
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider dark:text-slate-400">
                        Режим оплаты
                    </p>
                    <p className="mt-1 text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-1">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        {paymentModeLabel[contract.paymentMode] ?? contract.paymentMode}
                    </p>
                </div>
            </div>
        </div>
    );
}
