import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAuth } from "@/lib/auth/session";
import { contractService } from "@/lib/services/contract.service";

import { ContractHeaderCard } from "./_components/contract-header-card";
import { PaymentLogicCard } from "./_components/payment-logic-card";
import { PaymentScheduleTable } from "./_components/payment-schedule-table";
import { CreateContractDialog } from "./_components/create-contract-dialog";
import { CreateEnrollmentDialog } from "./_components/create-enrollment-dialog";
import { RenewalWizardDialog } from "./_components/renewal-wizard-dialog";
import { ContractViewer } from "./_components/contract-viewer";

interface Props {
    params: Promise<{ id: string }>;
    searchParams: Promise<{ action?: string }>;
}

export default async function ContractPage({ params, searchParams }: Props) {
    const { id } = await params;
    const { action } = await searchParams;
    const { role } = await requireAuth();

    const data = await contractService.getContractPage(id, role);
    if (!data) notFound();

    const { student, contract, enrollmentId, paymentItems, stats, canWrite } = data;

    // Build current contract info for renewal wizard
    const currentContractInfo = contract
        ? {
            contractNumber: contract.contractNumber,
            grade: null as string | null,
            academicYear: null as string | null,
            totalPaid: stats.totalPaid,
            totalExpected: stats.totalExpected,
            paymentItems: paymentItems,
        }
        : null;

    // Build PDF data for viewer
    const primaryGuardian = data.guardians.find(g => g.fullName) || data.guardians[0];
    const pdfData = contract ? {
        contractNumber: contract.contractNumber || "Б/Н",
        contractDate: new Date(contract.startedAt),
        studentName: student.fullName,
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
        grade: data.grade
    } : null;

    return (
        <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6">
            {/* Breadcrumbs */}
            <nav className="flex items-center text-sm font-medium text-slate-500 dark:text-slate-400">
                <Link href="/students" className="hover:text-[#207fdf] transition-colors">
                    Студенты
                </Link>
                <span className="mx-2 text-slate-300 dark:text-slate-600">/</span>
                <Link href={`/students/${id}`} className="hover:text-[#207fdf] transition-colors">
                    {student.fullName}
                </Link>
                <span className="mx-2 text-slate-300 dark:text-slate-600">/</span>
                <span className="text-slate-900 dark:text-white">Договор</span>
            </nav>

            {/* Page title + header CTA */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                        Договор и платежи
                    </h1>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                        {student.fullName}
                    </p>
                </div>

                {/* CTAs based on state */}
                <div className="flex items-center gap-3">
                    {canWrite && contract && (
                        <RenewalWizardDialog
                            studentId={id}
                            studentName={student.fullName}
                            currentContract={currentContractInfo}
                            autoOpen={action === "renew"}
                        />
                    )}
                    {canWrite && !contract && enrollmentId && (
                        <CreateContractDialog
                            studentId={id}
                            enrollmentId={enrollmentId}
                            studentName={student.fullName}
                            guardians={data.guardians}
                            grade={data.grade}
                        />
                    )}
                    {canWrite && !contract && !enrollmentId && (
                        <CreateEnrollmentDialog studentId={id} />
                    )}
                </div>
            </div>

            {contract && pdfData ? (
                <>
                    {/* Contract summary + logic: 2/3 + 1/3 */}
                    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                        <ContractHeaderCard
                            contract={contract}
                            basePrice={contract.basePrice}
                            discountPercent={contract.basePrice > 0 ? Math.round((contract.discountAmount / contract.basePrice) * 100) : 0}
                            canEdit={canWrite}
                            studentId={id}
                            studentName={student.fullName}
                            guardians={data.guardians}
                            grade={data.grade}
                            paymentItems={paymentItems}
                        />
                        <PaymentLogicCard
                            totalPaid={stats.totalPaid}
                            totalExpected={stats.totalExpected}
                            totalRemaining={stats.totalRemaining}
                            percentPaid={stats.percentPaid}
                            overdueCount={stats.overdueCount}
                            nextDueDate={stats.nextPayment?.dueDate ?? null}
                            advanceBalance={data.advance.balance}
                            advanceLastEntryAt={data.advance.lastEntryAt}
                            advanceLastReason={data.advance.lastReason}
                        />
                    </div>

                    {/* Inline PDF contract viewer */}
                    <ContractViewer data={pdfData} />

                    {/* Payment schedule table */}
                    <PaymentScheduleTable
                        items={paymentItems}
                        studentId={id}
                        contractId={contract.id}
                        canEdit={canWrite}
                        canRecord={data.canRecordPayment}
                    />
                </>
            ) : (
                /* Empty state */
                <div className="rounded-xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm p-16 text-center">
                    <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">
                        Договор не создан
                    </h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
                        У студента ещё нет активного договора
                    </p>
                    {canWrite && enrollmentId ? (
                        <CreateContractDialog
                            studentId={id}
                            enrollmentId={enrollmentId}
                            studentName={student.fullName}
                            guardians={data.guardians}
                            grade={data.grade}
                        />
                    ) : canWrite ? (
                        <div className="space-y-3">
                            <p className="text-sm font-semibold text-amber-600 dark:text-amber-400">
                                ⚠ Сначала создайте зачисление для студента
                            </p>
                            <CreateEnrollmentDialog studentId={id} />
                        </div>
                    ) : null}
                </div>
            )}
        </div>
    );
}
