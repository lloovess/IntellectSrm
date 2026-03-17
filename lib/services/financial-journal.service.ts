import { checkPermission } from "@/lib/auth/guard";
import type { Role } from "@/lib/auth/config";
import { financialJournalRepository } from "@/lib/db/repositories/financial-journal.repo";
import type { FinancialJournalFilters } from "@/types/financial-journal";

function formatDate(value: Date) {
    return value.toISOString().slice(0, 10);
}

export class FinancialJournalService {
    async getPage(filters: Partial<FinancialJournalFilters>, role: Role) {
        if (!checkPermission(role, "financial_audit.read")) {
            return { rows: [], branches: [], filters: this.getDefaultFilters(filters) };
        }

        const normalized = this.getDefaultFilters(filters);
        const data = await financialJournalRepository.getPage(normalized);

        return {
            ...data,
            filters: normalized,
        };
    }

    private getDefaultFilters(filters: Partial<FinancialJournalFilters>): FinancialJournalFilters {
        const today = new Date();
        const start = new Date(today);
        start.setDate(today.getDate() - 30);

        return {
            periodFrom: filters.periodFrom ?? formatDate(start),
            periodTo: filters.periodTo ?? formatDate(today),
            studentQuery: filters.studentQuery?.trim() ?? "",
            payerQuery: filters.payerQuery?.trim() ?? "",
            actorQuery: filters.actorQuery?.trim() ?? "",
            branchId: filters.branchId ?? "",
            eventType: filters.eventType ?? "",
            source: filters.source ?? "",
        };
    }
}

export const financialJournalService = new FinancialJournalService();
