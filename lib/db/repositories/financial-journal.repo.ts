import { createAdminClient } from "@/lib/supabase/server";
import type { FinancialJournalFilters, FinancialJournalRow } from "@/types/financial-journal";
import { buildAuditDiff, summarizeAuditDiff } from "@/lib/audit/utils";

type PaymentTransactionRow = {
    id: string;
    payment_item_id: string;
    amount: string;
    paid_at: string;
    source: string | null;
    created_by: string | null;
    payer_name: string | null;
    payer_phone: string | null;
    allocation_group_id: string | null;
    kind: string | null;
    notes: string | null;
    is_reversed: boolean;
};

type PaymentItemRow = {
    id: string;
    contract_id: string;
    due_date: string;
    label: string | null;
};

type ContractRow = {
    id: string;
    contract_number: string | null;
    enrollment_id: string;
};

type EnrollmentRow = {
    id: string;
    student_id: string;
    branch_id: string | null;
};

type StudentRow = {
    id: string;
    full_name: string;
};

type BranchRow = {
    id: string;
    name: string;
};

type AuditLogRow = {
    id: string;
    entity_type: string;
    entity_id: string;
    action: string;
    old_value: Record<string, unknown> | null;
    new_value: Record<string, unknown> | null;
    actor: string | null;
    created_at: string;
};

function includesValue(haystack: string | null | undefined, needle: string | undefined) {
    if (!needle) return true;
    return (haystack ?? "").toLowerCase().includes(needle.toLowerCase());
}

export class FinancialJournalRepository {
    async getPage(filters: FinancialJournalFilters): Promise<{
        rows: FinancialJournalRow[];
        branches: Array<{ id: string; name: string }>;
    }> {
        const admin = await createAdminClient();

        const [{ data: transactions, error: txError }, { data: auditLogs, error: auditError }, { data: branchesData, error: branchesError }] = await Promise.all([
            admin
                .from("payment_transactions")
                .select("id,payment_item_id,amount,paid_at,source,created_by,payer_name,payer_phone,allocation_group_id,kind,notes,is_reversed")
                .gte("paid_at", `${filters.periodFrom}T00:00:00.000Z`)
                .lte("paid_at", `${filters.periodTo}T23:59:59.999Z`)
                .order("paid_at", { ascending: false })
                .limit(300),
            admin
                .from("audit_logs")
                .select("id,entity_type,entity_id,action,old_value,new_value,actor,created_at")
                .in("entity_type", ["contract", "contracts", "payment_item", "payment_items"])
                .gte("created_at", `${filters.periodFrom}T00:00:00.000Z`)
                .lte("created_at", `${filters.periodTo}T23:59:59.999Z`)
                .order("created_at", { ascending: false })
                .limit(300),
            admin.from("branches").select("id,name").order("name"),
        ]);

        if (txError) throw new Error(txError.message);
        if (auditError) throw new Error(auditError.message);
        if (branchesError) throw new Error(branchesError.message);

        const paymentItemIds = [...new Set((transactions ?? []).map((item) => item.payment_item_id))];
        const auditEntityIds = [...new Set((auditLogs ?? []).map((item) => item.entity_id))];

        const { data: paymentItems } = paymentItemIds.length > 0
            ? await admin.from("payment_items").select("id,contract_id,due_date,label").in("id", [...new Set([...paymentItemIds, ...auditEntityIds])])
            : { data: [] as PaymentItemRow[] };
        const contractIdsFromPayments = (paymentItems ?? []).map((item) => item.contract_id);
        const contractIdsFromAudit = (auditLogs ?? [])
            .filter((item) => item.entity_type === "contract" || item.entity_type === "contracts")
            .map((item) => item.entity_id);
        const contractIds = [...new Set([...contractIdsFromPayments, ...contractIdsFromAudit])];

        const { data: contracts } = contractIds.length > 0
            ? await admin.from("contracts").select("id,contract_number,enrollment_id").in("id", contractIds)
            : { data: [] as ContractRow[] };
        const enrollmentIds = [...new Set((contracts ?? []).map((item) => item.enrollment_id))];

        const { data: enrollments } = enrollmentIds.length > 0
            ? await admin.from("enrollments").select("id,student_id,branch_id").in("id", enrollmentIds)
            : { data: [] as EnrollmentRow[] };
        const studentIds = [...new Set((enrollments ?? []).map((item) => item.student_id))];

        const { data: students } = studentIds.length > 0
            ? await admin.from("students").select("id,full_name").in("id", studentIds)
            : { data: [] as StudentRow[] };

        const paymentItemsById = new Map((paymentItems ?? []).map((item) => [item.id, item]));
        const contractsById = new Map((contracts ?? []).map((item) => [item.id, item]));
        const enrollmentsById = new Map((enrollments ?? []).map((item) => [item.id, item]));
        const studentsById = new Map((students ?? []).map((item) => [item.id, item]));
        const branchesById = new Map((branchesData ?? []).map((item) => [item.id, item]));

        const paymentRows: FinancialJournalRow[] = (transactions ?? []).map((tx) => {
            const paymentItem = paymentItemsById.get(tx.payment_item_id);
            const contract = paymentItem ? contractsById.get(paymentItem.contract_id) : null;
            const enrollment = contract ? enrollmentsById.get(contract.enrollment_id) : null;
            const student = enrollment ? studentsById.get(enrollment.student_id) : null;
            const branch = enrollment?.branch_id ? branchesById.get(enrollment.branch_id) : null;
            const allocationSummary = tx.notes
                ? [{ paymentItemId: tx.payment_item_id, label: paymentItem?.label ?? "Платеж", allocatedAmount: Number(tx.amount), kind: tx.kind ?? "payment" }]
                : [{ paymentItemId: tx.payment_item_id, label: paymentItem?.label ?? "Платеж", allocatedAmount: Number(tx.amount), kind: tx.kind ?? "payment" }];
            const summary = [
                `${paymentItem?.label ?? "Платеж"}: ${Number(tx.amount).toLocaleString("ru-RU", { maximumFractionDigits: 2 })}`,
                tx.notes ?? "",
                tx.is_reversed ? "Транзакция отменена" : "",
            ].filter(Boolean);

            return {
                id: `payment-${tx.id}`,
                happenedAt: tx.paid_at,
                eventType: tx.is_reversed ? "payment_reversal" : (tx.kind ?? "payment"),
                title: tx.is_reversed ? "Сторно оплаты" : "Оплата",
                studentId: enrollment?.student_id ?? null,
                studentName: student?.full_name ?? null,
                branchName: branch?.name ?? null,
                contractId: contract?.id ?? null,
                contractNumber: contract?.contract_number ?? null,
                paymentItemId: paymentItem?.id ?? null,
                paymentLabel: paymentItem?.label ?? null,
                amount: Number(tx.amount),
                payerName: tx.payer_name,
                payerPhone: tx.payer_phone,
                actor: tx.created_by,
                source: tx.source,
                summary,
                allocationSummary,
                diff: [],
                metadata: {
                    allocationGroupId: tx.allocation_group_id,
                    notes: tx.notes,
                    kind: tx.kind,
                },
            };
        });

        const auditRows: FinancialJournalRow[] = (auditLogs ?? []).map((log) => {
            const relatedPaymentItem = log.entity_type === "payment_item" || log.entity_type === "payment_items"
                ? paymentItemsById.get(log.entity_id)
                : null;
            const relatedContract = log.entity_type === "contract" || log.entity_type === "contracts"
                ? contractsById.get(log.entity_id)
                : relatedPaymentItem
                    ? contractsById.get(relatedPaymentItem.contract_id)
                    : null;
            const enrollment = relatedContract ? enrollmentsById.get(relatedContract.enrollment_id) : null;
            const student = enrollment ? studentsById.get(enrollment.student_id) : null;
            const branch = enrollment?.branch_id ? branchesById.get(enrollment.branch_id) : null;
            const diff = buildAuditDiff(log.old_value, log.new_value);

            return {
                id: `audit-${log.id}`,
                happenedAt: log.created_at,
                eventType: log.action,
                title: log.entity_type === "contract" || log.entity_type === "contracts" ? "Изменение договора" : "Изменение платежа",
                studentId: enrollment?.student_id ?? null,
                studentName: student?.full_name ?? null,
                branchName: branch?.name ?? null,
                contractId: relatedContract?.id ?? null,
                contractNumber: relatedContract?.contract_number ?? null,
                paymentItemId: relatedPaymentItem?.id ?? null,
                paymentLabel: relatedPaymentItem?.label ?? null,
                amount: typeof log.new_value?.amount === "number" ? log.new_value.amount : null,
                payerName: typeof log.new_value?.payerName === "string" ? log.new_value.payerName : null,
                payerPhone: typeof log.new_value?.payerPhone === "string" ? log.new_value.payerPhone : null,
                actor: log.actor,
                source: typeof log.new_value?.source === "string" ? log.new_value.source : null,
                summary: summarizeAuditDiff(log.old_value, log.new_value),
                allocationSummary: Array.isArray(log.new_value?.allocationSummary) ? log.new_value.allocationSummary as FinancialJournalRow["allocationSummary"] : [],
                diff,
                metadata: {
                    action: log.action,
                    oldValue: log.old_value,
                    newValue: log.new_value,
                },
            };
        });

        const rows = [...paymentRows, ...auditRows]
            .filter((row) => includesValue(row.studentName, filters.studentQuery))
            .filter((row) => includesValue(row.payerName, filters.payerQuery))
            .filter((row) => includesValue(row.actor, filters.actorQuery))
            .filter((row) => !filters.branchId || row.branchName === branchesById.get(filters.branchId)?.name)
            .filter((row) => !filters.eventType || row.eventType === filters.eventType)
            .filter((row) => !filters.source || row.source === filters.source)
            .sort((a, b) => new Date(b.happenedAt).getTime() - new Date(a.happenedAt).getTime());

        return {
            rows,
            branches: (branchesData ?? []).map((item) => ({ id: item.id, name: item.name })),
        };
    }
}

export const financialJournalRepository = new FinancialJournalRepository();
