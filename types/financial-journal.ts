import type { AuditDiffItem } from "@/lib/audit/utils";

export interface FinancialJournalFilters {
    periodFrom: string;
    periodTo: string;
    studentQuery?: string;
    payerQuery?: string;
    actorQuery?: string;
    branchId?: string;
    eventType?: string;
    source?: string;
}

export interface FinancialJournalRow {
    id: string;
    happenedAt: string;
    eventType: string;
    title: string;
    studentId: string | null;
    studentName: string | null;
    branchName: string | null;
    contractId: string | null;
    contractNumber: string | null;
    paymentItemId: string | null;
    paymentLabel: string | null;
    amount: number | null;
    payerName: string | null;
    payerPhone: string | null;
    actor: string | null;
    source: string | null;
    summary: string[];
    allocationSummary: Array<{
        paymentItemId: string;
        label: string;
        allocatedAmount: number;
        kind: string;
    }>;
    diff: AuditDiffItem[];
    metadata: Record<string, unknown> | null;
}
