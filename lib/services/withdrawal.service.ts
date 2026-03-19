import { requireAuth } from "@/lib/auth";
import { withdrawalRepository, type SettlementCalc } from "@/lib/db/repositories/withdrawal.repo";
import { createAdminClient } from "@/lib/supabase/server";

export const withdrawalService = {

    async getPage() {
        const { role } = await requireAuth();
        if (!["admin", "finance_manager", "accountant", "assistant"].includes(role)) {
            throw new Error("Нет доступа к отчислениям");
        }
        const list = await withdrawalRepository.getList();
        return { list };
    },

    async calculateSettlement(enrollmentId: string): Promise<SettlementCalc> {
        await requireAuth();
        return withdrawalRepository.calculateSettlement(enrollmentId);
    },

    async createCase(data: {
        enrollmentId: string;
        reason: string;
        effectiveDate: string;
    }) {
        const user = await requireAuth();
        if (!["admin", "finance_manager", "accountant", "assistant"].includes(user.role)) {
            throw new Error("Нет прав на создание заявки об отчислении");
        }

        // Calculate settlement amount
        const settlement = await withdrawalRepository.calculateSettlement(data.enrollmentId);

        const id = await withdrawalRepository.createWithdrawal({
            ...data,
            settlementType: settlement.settlementAmount > 0 ? "debt" : settlement.settlementAmount < 0 ? "refund" : "zero",
            settlementAmount: settlement.settlementAmount,
        });

        // Audit log
        const admin = await createAdminClient();
        await admin.from("audit_logs").insert({
            actor: user.email,
            action: "withdrawal.create",
            entity_type: "withdrawal_cases",
            entity_id: id,
            new_value: JSON.stringify({ enrollmentId: data.enrollmentId, reason: data.reason }),
        });

        return { id, settlement };
    },

    async approveCase(id: string) {
        const user = await requireAuth();
        if (!["admin", "finance_manager"].includes(user.role)) {
            throw new Error("Нет прав на апрув отчисления");
        }

        await withdrawalRepository.approve(id, user.email);

        // Audit log
        const admin = await createAdminClient();
        await admin.from("audit_logs").insert({
            actor: user.email,
            action: "withdrawal.approve",
            entity_type: "withdrawal_cases",
            entity_id: id,
            new_value: JSON.stringify({ approvedBy: user.email }),
        });
    },

    /** Get active enrollments for create-dialog (student picker) */
    async getActiveEnrollments() {
        await requireAuth();
        const admin = await createAdminClient();
        const { data } = await admin
            .from("enrollments")
            .select(`
                id, grade, academic_year,
                branches ( name ),
                students ( full_name, phone )
            `)
            .eq("status", "active")
            .order("created_at", { ascending: false });

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return (data ?? []).map((e: any) => ({
            id: e.id,
            grade: e.grade,
            academicYear: e.academic_year,
            branchName: e.branches?.name ?? "—",
            studentName: e.students?.full_name ?? "—",
            studentPhone: e.students?.phone ?? "—",
        }));
    },
};
