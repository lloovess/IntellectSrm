import { BaseRepository } from "./base.repo";
import { db } from "../index";
import { collectionTasks, type CollectionTask, type NewCollectionTask } from "../schema/collection-tasks";
import { paymentItems } from "../schema/payment-items";
import { contracts } from "../schema/contracts";
import { enrollments } from "../schema/enrollments";
import { students } from "../schema/students";
import { branches } from "../schema/branches";
import { eq, and, inArray, lt, desc, count, gte, notInArray } from "drizzle-orm";

export type CollectionPriority = "high" | "medium" | "low";

export interface DashboardCollectionTask {
    id: string;
    status: string;
    note: string | null;
    updatedAt: string;
}

export interface CollectionQueueRow {
    student: {
        id: string;
        fullName: string;
        phone: string;
    };
    enrollment: {
        grade: string;
        branchName: string;
    };
    paymentItem: {
        id: string;
        amount: number;
        paidAmount: number;
        dueDate: string;
        label: string;
    };
    task: DashboardCollectionTask | null;
    debtAmount: number;
    overdueDays: number;
    priority: CollectionPriority;
}

export interface CollectionStats {
    totalDebt: number;
    activeTasks: number;
    resolvedToday: number;
}

function computePriority(overdueDays: number): CollectionPriority {
    if (overdueDays > 10) return "high";
    if (overdueDays >= 4) return "medium";
    return "low";
}

function overdueDays(dueDate: string | Date): number {
    const due = new Date(dueDate);
    const now = new Date();
    const diffMs = now.getTime() - due.getTime();
    return Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
}

export class CollectionRepository extends BaseRepository<typeof collectionTasks, CollectionTask, NewCollectionTask> {
    constructor() {
        super(collectionTasks);
    }

    async getQueue(): Promise<CollectionQueueRow[]> {
        const todayStr = new Date().toISOString().substring(0, 10);

        const rows = await db
            .select({
                paymentItem: paymentItems,
                contract: contracts,
                enrollment: enrollments,
                student: students,
                branch: branches,
                task: collectionTasks
            })
            .from(paymentItems)
            .innerJoin(contracts, eq(paymentItems.contractId, contracts.id))
            .innerJoin(enrollments, eq(contracts.enrollmentId, enrollments.id))
            .innerJoin(students, eq(enrollments.studentId, students.id))
            .leftJoin(branches, eq(enrollments.branchId, branches.id))
            .leftJoin(collectionTasks, and(
                eq(collectionTasks.paymentItemId, paymentItems.id),
                notInArray(collectionTasks.status, ["refused", "closed"])
            ))
            .where(and(
                inArray(paymentItems.status, ["overdue", "partially_paid", "planned"]),
                lt(paymentItems.dueDate, todayStr)
            ));

        const queueRows: CollectionQueueRow[] = rows.map(row => {
            const amount = parseFloat(row.paymentItem.amount);
            const paidAmount = parseFloat(row.paymentItem.paidAmount);
            const debt = amount - paidAmount;
            const days = overdueDays(row.paymentItem.dueDate);

            return {
                student: {
                    id: row.student.id,
                    fullName: row.student.fullName,
                    phone: row.student.phone ?? "—",
                },
                enrollment: {
                    grade: row.enrollment.grade ?? "—",
                    branchName: row.branch?.name ?? "—",
                },
                paymentItem: {
                    id: row.paymentItem.id,
                    amount,
                    paidAmount,
                    dueDate: row.paymentItem.dueDate,
                    label: row.paymentItem.label ?? "—",
                },
                task: row.task ? {
                    id: row.task.id,
                    status: row.task.status,
                    note: row.task.note,
                    updatedAt: row.task.updatedAt.toISOString(),
                } : null,
                debtAmount: debt,
                overdueDays: days,
                priority: computePriority(days),
            };
        });

        // Sort by overdue days DESC
        return queueRows.sort((a, b) => b.overdueDays - a.overdueDays);
    }

    async getStats(): Promise<CollectionStats> {
        const todayStr = new Date().toISOString().substring(0, 10);

        // Total debt from overdue items
        const debtData = await db
            .select({
                amount: paymentItems.amount,
                paidAmount: paymentItems.paidAmount,
            })
            .from(paymentItems)
            .where(and(
                inArray(paymentItems.status, ["overdue", "partially_paid"]),
                lt(paymentItems.dueDate, todayStr)
            ));

        const totalDebt = debtData.reduce((sum, row) => sum + (parseFloat(row.amount) - parseFloat(row.paidAmount)), 0);

        // Active tasks
        const [{ count: activeTasks }] = await db
            .select({ count: count() })
            .from(collectionTasks)
            .where(inArray(collectionTasks.status, ["no_contact", "contacted", "promise_to_pay"]));

        // Resolved today
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);

        const [{ count: resolvedToday }] = await db
            .select({ count: count() })
            .from(collectionTasks)
            .where(and(
                inArray(collectionTasks.status, ["refused", "closed"]),
                gte(collectionTasks.updatedAt, todayStart)
            ));

        return {
            totalDebt,
            activeTasks: activeTasks ?? 0,
            resolvedToday: resolvedToday ?? 0,
        };
    }

    async updateTaskStatus(taskId: string, status: string, note: string): Promise<void> {
        await this.update(taskId, {
            status,
            note
        });
    }

    async createTask(studentId: string, paymentItemId: string): Promise<string> {
        const task = await this.create({
            studentId,
            paymentItemId,
            status: "no_contact",
            note: ""
        });
        return task.id;
    }
}

export const collectionRepository = new CollectionRepository();
