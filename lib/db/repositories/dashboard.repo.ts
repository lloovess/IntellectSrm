import { unstable_cache } from "next/cache";
import { db } from "../index";
import { paymentTransactions } from "../schema/payment-transactions";
import { paymentItems } from "../schema/payment-items";
import { contracts } from "../schema/contracts";
import { enrollments } from "../schema/enrollments";
import { students } from "../schema/students";
import { sql, desc, eq, ne, asc } from "drizzle-orm";

export interface RecentTransaction {
    id: string;
    studentName: string;
    amount: number;
    paymentMethod: string;
    paymentDate: string;
}

export interface OverdueItem {
    id: string;
    studentName: string;
    amountDue: number;
    dueDate: string;
}

export const dashboardRepository = {
    async getTotalRevenue(): Promise<number> {
        return unstable_cache(
            async () => {
                const result = await db
                    .select({ total: sql<string>`sum(${paymentTransactions.amount})` })
                    .from(paymentTransactions);

                return parseFloat(result[0]?.total || "0");
            },
            ['dashboard-total-revenue'],
            { revalidate: 3600, tags: ['dashboard_metrics'] }
        )();
    },

    async getTotalDebt(): Promise<number> {
        return unstable_cache(
            async () => {
                const result = await db
                    .select({
                        total: sql<string>`sum(GREATEST(0, ${paymentItems.amount} - ${paymentItems.paidAmount}))`
                    })
                    .from(paymentItems)
                    .where(ne(paymentItems.status, 'paid'));

                return parseFloat(result[0]?.total || "0");
            },
            ['dashboard-total-debt'],
            { revalidate: 3600, tags: ['dashboard_metrics'] }
        )();
    },

    async getActiveStudentsCount(): Promise<number> {
        return unstable_cache(
            async () => {
                const result = await db
                    .select({ count: sql<number>`count(*)` })
                    .from(students)
                    .where(eq(students.status, 'active'));

                return Number(result[0]?.count || 0);
            },
            ['dashboard-active-students'],
            { revalidate: 3600, tags: ['dashboard_metrics'] }
        )();
    },

    async getOverdueItemsCount(): Promise<number> {
        return unstable_cache(
            async () => {
                const result = await db
                    .select({ count: sql<number>`count(*)` })
                    .from(paymentItems)
                    .where(eq(paymentItems.status, 'overdue'));

                return Number(result[0]?.count || 0);
            },
            ['dashboard-overdue-count'],
            { revalidate: 3600, tags: ['dashboard_metrics'] }
        )();
    },

    async getRecentTransactions(limit = 8): Promise<RecentTransaction[]> {
        const results = await db
            .select({
                id: paymentTransactions.id,
                amount: paymentTransactions.amount,
                source: paymentTransactions.source,
                paidAt: paymentTransactions.paidAt,
                studentName: students.fullName,
            })
            .from(paymentTransactions)
            .leftJoin(paymentItems, eq(paymentTransactions.paymentItemId, paymentItems.id))
            .leftJoin(contracts, eq(paymentItems.contractId, contracts.id))
            .leftJoin(enrollments, eq(contracts.enrollmentId, enrollments.id))
            .leftJoin(students, eq(enrollments.studentId, students.id))
            .orderBy(desc(paymentTransactions.paidAt))
            .limit(limit);

        return results.map(r => ({
            id: r.id,
            studentName: r.studentName ?? "—",
            amount: parseFloat(r.amount || "0"),
            paymentMethod: r.source,
            paymentDate: r.paidAt ? r.paidAt.toISOString() : new Date().toISOString()
        }));
    },

    async getOverdueItems(limit = 5): Promise<OverdueItem[]> {
        const results = await db
            .select({
                id: paymentItems.id,
                amount: paymentItems.amount,
                paidAmount: paymentItems.paidAmount,
                dueDate: paymentItems.dueDate,
                studentName: students.fullName,
            })
            .from(paymentItems)
            .leftJoin(contracts, eq(paymentItems.contractId, contracts.id))
            .leftJoin(enrollments, eq(contracts.enrollmentId, enrollments.id))
            .leftJoin(students, eq(enrollments.studentId, students.id))
            .where(eq(paymentItems.status, 'overdue'))
            .orderBy(asc(paymentItems.dueDate))
            .limit(limit);

        return results.map(r => ({
            id: r.id,
            studentName: r.studentName ?? "—",
            amountDue: Math.max(0, parseFloat(r.amount || "0") - parseFloat(r.paidAmount || "0")),
            dueDate: r.dueDate,
        }));
    }
};
