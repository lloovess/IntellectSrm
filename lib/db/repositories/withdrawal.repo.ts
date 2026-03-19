import { BaseRepository } from "./base.repo";
import { createAdminClient } from "@/lib/supabase/server";
import { withdrawalCases, type WithdrawalCase, type NewWithdrawalCase } from "../schema/withdrawal-cases";

export interface WithdrawalListRow {
    id: string;
    enrollmentId: string;
    reason: string;
    effectiveDate: string | null;
    settlementAmount: number;
    isApproved: boolean;
    approvedBy: string | null;
    approvedAt: string | null;
    createdAt: string;
    student: { fullName: string; phone: string };
    enrollment: { grade: string; branchName: string };
}

export interface SettlementCalc {
    basePrice: number;
    totalPaid: number;
    unpaidMonths: number;
    totalMonths: number;
    settlementAmount: number;
}

export class WithdrawalRepository extends BaseRepository<typeof withdrawalCases, WithdrawalCase, NewWithdrawalCase> {
    constructor() {
        super(withdrawalCases);
    }

    async getList(): Promise<WithdrawalListRow[]> {
        const admin = await createAdminClient();
        const { data, error } = await admin
            .from("withdrawal_cases")
            .select(`
                id, enrollment_id, reason, effective_date, settlement_amount, approved_by, approved_at, created_at,
                enrollments:enrollment_id (
                    grade,
                    branches:branch_id ( name ),
                    students:student_id ( full_name, phone )
                )
            `)
            .order("created_at", { ascending: false });

        if (error) {
            console.error("Withdrawals getList error:", error);
            throw new Error(error.message);
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return (data || []).map((row: any) => {
            const enroll = row.enrollments;
            // Supabase returns related objects as single object or array depending on relationship.
            // Since enrollment->branch is many-to-one, branches is an object.
            const branch = enroll?.branches;
            const student = enroll?.students;

            return {
                id: row.id,
                enrollmentId: row.enrollment_id,
                reason: row.reason,
                effectiveDate: row.effective_date,
                settlementAmount: parseFloat(row.settlement_amount ?? "0"),
                isApproved: !!row.approved_at,
                approvedBy: row.approved_by,
                approvedAt: row.approved_at ? new Date(row.approved_at).toISOString() : null,
                createdAt: new Date(row.created_at).toISOString(),
                student: {
                    fullName: student?.full_name ?? "—",
                    phone: student?.phone ?? "—",
                },
                enrollment: {
                    grade: enroll?.grade ?? "—",
                    branchName: branch?.name ?? "—",
                },
            };
        });
    }

    async calculateSettlement(enrollmentId: string): Promise<SettlementCalc> {
        const admin = await createAdminClient();
        const { data: contractData, error: contractError } = await admin
            .from("contracts")
            .select("id, base_price")
            .eq("enrollment_id", enrollmentId)
            .eq("status", "active")
            .limit(1);

        if (contractError && contractError.code !== "PGRST116") {
            // PGRST116 is "JWT string empty" or similar row not found for .single(), but limit(1) doesn't throw it usually.
            console.error(contractError);
        }

        const contractInfo = contractData?.[0];

        if (!contractInfo) {
            return { basePrice: 0, totalPaid: 0, unpaidMonths: 0, totalMonths: 0, settlementAmount: 0 };
        }

        const { data: itemsData, error: itemsError } = await admin
            .from("payment_items")
            .select("amount, paid_amount, status")
            .eq("contract_id", contractInfo.id);

        if (itemsError) throw new Error(itemsError.message);
        const items = itemsData || [];

        const totalMonths = items.length;
        const unpaidMonths = items.filter(i => i.status === "planned" || i.status === "overdue").length;
        const totalPaid = items.reduce((sum, i) => sum + (parseFloat(i.paid_amount ?? "0") || 0), 0);
        const basePrice = parseFloat(contractInfo.base_price ?? "0") || 0;

        const settlementAmount = totalMonths > 0
            ? Math.round((unpaidMonths / totalMonths) * basePrice)
            : 0;

        return { basePrice, totalPaid, unpaidMonths, totalMonths, settlementAmount };
    }

    async createWithdrawal(data: {
        enrollmentId: string;
        reason: string;
        effectiveDate: string;
        settlementType: string;
        settlementAmount: number;
    }): Promise<string> {
        const admin = await createAdminClient();
        const { data: result, error } = await admin
            .from("withdrawal_cases")
            .insert({
                enrollment_id: data.enrollmentId,
                reason: data.reason,
                effective_date: data.effectiveDate,
                settlement_type: data.settlementType,
                settlement_amount: data.settlementAmount.toString(),
                status: "pending"
            })
            .select("id")
            .single();

        if (error) throw new Error(error.message);
        return result.id;
    }

    async approve(id: string, approvedBy: string): Promise<void> {
        const admin = await createAdminClient();
        
        const { data: wcData, error: wcError } = await admin
            .from("withdrawal_cases")
            .select("enrollment_id")
            .eq("id", id)
            .single();

        if (wcError || !wcData) throw new Error("Заявка не найдена");

        // 1. Update the withdrawal case
        await admin
            .from("withdrawal_cases")
            .update({
                approved_by: approvedBy,
                approved_at: new Date().toISOString(),
                status: "approved"
            })
            .eq("id", id);

        // 2. Update enrollment status to 'withdrawn'
        await admin
            .from("enrollments")
            .update({ status: "withdrawn" })
            .eq("id", wcData.enrollment_id);

        // 3. Mark all planned/overdue payment_items as cancelled
        const { data: contractData } = await admin
            .from("contracts")
            .select("id")
            .eq("enrollment_id", wcData.enrollment_id)
            .eq("status", "active")
            .limit(1);

        const contract = contractData?.[0];

        if (contract) {
            await admin
                .from("payment_items")
                .update({ status: "cancelled" })
                .eq("contract_id", contract.id)
                .in("status", ["planned", "overdue"]);

            await admin
                .from("contracts")
                .update({ status: "cancelled" })
                .eq("id", contract.id);
        }
    }
}

export const withdrawalRepository = new WithdrawalRepository();
