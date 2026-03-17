import { BaseRepository } from "./base.repo";
import { db } from "../index";
import { withdrawalCases, type WithdrawalCase, type NewWithdrawalCase } from "../schema/withdrawal-cases";
import { contracts } from "../schema/contracts";
import { enrollments } from "../schema/enrollments";
import { paymentItems } from "../schema/payment-items";
import { students } from "../schema/students";
import { branches } from "../schema/branches";
import { eq, and, desc, inArray } from "drizzle-orm";

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
        const rows = await db
            .select({
                withdrawal: withdrawalCases,
                enrollment: enrollments,
                student: students,
                branch: branches
            })
            .from(withdrawalCases)
            .innerJoin(enrollments, eq(withdrawalCases.enrollmentId, enrollments.id))
            .innerJoin(students, eq(enrollments.studentId, students.id))
            .leftJoin(branches, eq(enrollments.branchId, branches.id))
            .orderBy(desc(withdrawalCases.createdAt));

        return rows.map(row => ({
            id: row.withdrawal.id,
            enrollmentId: row.withdrawal.enrollmentId,
            reason: row.withdrawal.reason,
            effectiveDate: row.withdrawal.effectiveDate,
            settlementAmount: parseFloat(row.withdrawal.settlementAmount ?? "0"),
            isApproved: !!row.withdrawal.approvedAt,
            approvedBy: row.withdrawal.approvedBy,
            approvedAt: row.withdrawal.approvedAt ? row.withdrawal.approvedAt.toISOString() : null,
            createdAt: row.withdrawal.createdAt.toISOString(),
            student: {
                fullName: row.student.fullName,
                phone: row.student.phone ?? "—",
            },
            enrollment: {
                grade: row.enrollment.grade ?? "—",
                branchName: row.branch?.name ?? "—",
            },
        }));
    }

    async calculateSettlement(enrollmentId: string): Promise<SettlementCalc> {
        const [contractInfo] = await db
            .select({
                id: contracts.id,
                basePrice: contracts.basePrice,
            })
            .from(contracts)
            .where(and(
                eq(contracts.enrollmentId, enrollmentId),
                eq(contracts.status, "active")
            ))
            .limit(1);

        if (!contractInfo) {
            return { basePrice: 0, totalPaid: 0, unpaidMonths: 0, totalMonths: 0, settlementAmount: 0 };
        }

        const items = await db
            .select({
                amount: paymentItems.amount,
                paidAmount: paymentItems.paidAmount,
                status: paymentItems.status
            })
            .from(paymentItems)
            .where(eq(paymentItems.contractId, contractInfo.id));

        const totalMonths = items.length;
        const unpaidMonths = items.filter(i => i.status === "planned" || i.status === "overdue").length;
        const totalPaid = items.reduce((sum, i) => sum + (parseFloat(i.paidAmount) || 0), 0);
        const basePrice = parseFloat(contractInfo.basePrice) || 0;

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
        const task = await super.create({
            enrollmentId: data.enrollmentId,
            reason: data.reason,
            effectiveDate: data.effectiveDate,
            settlementType: data.settlementType,
            settlementAmount: data.settlementAmount.toString(),
            status: "pending"
        });
        return task.id;
    }

    async approve(id: string, approvedBy: string): Promise<void> {
        await db.transaction(async (tx) => {
            const [wc] = await tx
                .select({ enrollmentId: withdrawalCases.enrollmentId })
                .from(withdrawalCases)
                .where(eq(withdrawalCases.id, id));

            if (!wc) throw new Error("Заявка не найдена");

            // 1. Update the withdrawal case
            await tx
                .update(withdrawalCases)
                .set({
                    approvedBy,
                    approvedAt: new Date(),
                    status: "approved"
                })
                .where(eq(withdrawalCases.id, id));

            // 2. Update enrollment status to 'withdrawn'
            await tx
                .update(enrollments)
                .set({ status: "withdrawn" })
                .where(eq(enrollments.id, wc.enrollmentId));

            // 3. Mark all planned/overdue payment_items as cancelled
            const [contract] = await tx
                .select({ id: contracts.id })
                .from(contracts)
                .where(and(
                    eq(contracts.enrollmentId, wc.enrollmentId),
                    eq(contracts.status, "active")
                ));

            if (contract) {
                await tx
                    .update(paymentItems)
                    .set({ status: "cancelled" })
                    .where(and(
                        eq(paymentItems.contractId, contract.id),
                        inArray(paymentItems.status, ["planned", "overdue"])
                    ));

                await tx
                    .update(contracts)
                    .set({ status: "cancelled" })
                    .where(eq(contracts.id, contract.id));
            }
        });
    }
}

export const withdrawalRepository = new WithdrawalRepository();
