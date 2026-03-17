import { asc, desc, eq, inArray, sql } from "drizzle-orm";
import { db } from "../index";
import { paymentItems, type PaymentItem, type NewPaymentItem } from "../schema/payment-items";
import { paymentTransactions, type PaymentTransaction, type NewPaymentTransaction } from "../schema/payment-transactions";
import { studentCreditLedger } from "../schema/student-credit-ledger";
import { contracts } from "../schema/contracts";
import { enrollments } from "../schema/enrollments";
import { BaseRepository } from "./base.repo";

export { type PaymentTransaction } from "../schema/payment-transactions";

export interface RecordPaymentData {
    paymentItemId: string;
    amount: number;
    source: string;
    payerName: string;
    payerPhone?: string;
    note?: string;
    paidAt?: Date;
    createdBy: string;
}

export interface PaymentAllocationSummary {
    paymentItemId: string;
    label: string;
    allocatedAmount: number;
    kind: string;
}

export interface StudentAdvanceSummary {
    balance: number;
    lastEntryAt: string | null;
    lastReason: string | null;
}

function computeStatus(params: {
    newPaidAmount: number;
    totalAmount: number;
    dueDate: string;
}): string {
    const { newPaidAmount, totalAmount, dueDate } = params;
    if (newPaidAmount >= totalAmount) return "paid";
    if (newPaidAmount > 0) return "partially_paid";
    const now = new Date();
    const due = new Date(dueDate);
    return now > due ? "overdue" : "planned";
}

export class PaymentRepository extends BaseRepository<typeof paymentItems, PaymentItem, NewPaymentItem> {
    constructor() {
        super(paymentItems);
    }

    async findByContractId(contractId: string): Promise<PaymentItem[]> {
        return db
            .select()
            .from(paymentItems)
            .where(eq(paymentItems.contractId, contractId))
            .orderBy(desc(paymentItems.dueDate));
    }

    async createTransaction(data: NewPaymentTransaction): Promise<PaymentTransaction> {
        const result = await db.insert(paymentTransactions).values(data).returning();
        return result[0];
    }

    async findTransactionsByItemId(paymentItemId: string): Promise<PaymentTransaction[]> {
        return db
            .select()
            .from(paymentTransactions)
            .where(eq(paymentTransactions.paymentItemId, paymentItemId))
            .orderBy(desc(paymentTransactions.paidAt));
    }

    async recordPayment(data: RecordPaymentData): Promise<{
        transaction: PaymentTransaction;
        newPaidAmount: number;
        newStatus: string;
        contractRemaining: number;
        studentAdvanceBalance: number;
        allocationSummary: PaymentAllocationSummary[];
        audit: {
            oldValue: Record<string, unknown>;
            newValue: Record<string, unknown>;
        };
    }> {
        return await db.transaction(async (tx) => {
            const [selectedItem] = await tx
                .select()
                .from(paymentItems)
                .where(eq(paymentItems.id, data.paymentItemId));

            if (!selectedItem) throw new Error("Payment item not found");

            const [contractContext] = await tx
                .select({
                    contractId: contracts.id,
                    contractNumber: contracts.contractNumber,
                    enrollmentId: contracts.enrollmentId,
                    studentId: enrollments.studentId,
                })
                .from(contracts)
                .innerJoin(enrollments, eq(contracts.enrollmentId, enrollments.id))
                .where(eq(contracts.id, selectedItem.contractId));

            if (!contractContext) throw new Error("Contract context not found");

            const contractItems = await tx
                .select()
                .from(paymentItems)
                .where(eq(paymentItems.contractId, selectedItem.contractId))
                .orderBy(asc(paymentItems.dueDate));

            const startIndex = contractItems.findIndex((item) => item.id === data.paymentItemId);
            if (startIndex < 0) throw new Error("Payment item not found in contract");

            const allocationTargets = contractItems.slice(startIndex);
            let toAllocate = data.amount;
            let selectedItemPaidAmount = parseFloat(String(selectedItem.paidAmount ?? "0"));
            let selectedItemStatus = selectedItem.status;
            let firstTransaction: PaymentTransaction | null = null;
            const allocationGroupId = crypto.randomUUID();
            const allocationSummary: PaymentAllocationSummary[] = [];
            const contractRemainingBefore = contractItems.reduce((sum, item) => {
                return sum + Math.max(0, parseFloat(String(item.amount ?? "0")) - parseFloat(String(item.paidAmount ?? "0")));
            }, 0);
            const advanceBefore = await this.computeAdvanceBalanceTx(tx, contractContext.studentId);

            for (const target of allocationTargets) {
                if (toAllocate <= 0) break;

                const currentPaid = parseFloat(String(target.paidAmount ?? "0"));
                const totalAmount = parseFloat(String(target.amount ?? "0"));
                const remaining = Math.max(0, totalAmount - currentPaid);
                if (remaining <= 0) continue;

                const allocation = Math.min(remaining, toAllocate);
                const newPaidAmount = currentPaid + allocation;
                const newStatus = computeStatus({
                    newPaidAmount,
                    totalAmount,
                    dueDate: target.dueDate,
                });

                const [transaction] = await tx
                    .insert(paymentTransactions)
                    .values({
                        paymentItemId: target.id,
                        amount: allocation.toString(),
                        paidAt: data.paidAt ?? new Date(),
                        source: data.source,
                        createdBy: data.createdBy,
                        payerName: data.payerName,
                        payerPhone: data.payerPhone ?? null,
                        allocationGroupId,
                        kind: target.id === selectedItem.id ? "payment" : "auto_allocation",
                        notes: target.id === selectedItem.id
                            ? data.note ?? null
                            : "Автозачёт переплаты на следующий платеж",
                    })
                    .returning();

                await tx
                    .update(paymentItems)
                    .set({
                        paidAmount: newPaidAmount.toString(),
                        status: newStatus,
                    })
                    .where(eq(paymentItems.id, target.id));

                if (!firstTransaction) firstTransaction = transaction;
                if (target.id === selectedItem.id) {
                    selectedItemPaidAmount = newPaidAmount;
                    selectedItemStatus = newStatus;
                }

                allocationSummary.push({
                    paymentItemId: target.id,
                    label: target.label ?? "Платеж",
                    allocatedAmount: allocation,
                    kind: transaction.kind,
                });

                toAllocate -= allocation;
            }

            if (!firstTransaction) {
                throw new Error("Платёж уже полностью закрыт");
            }

            if (toAllocate > 0.01) {
                await tx.insert(studentCreditLedger).values({
                    studentId: contractContext.studentId,
                    contractId: contractContext.contractId,
                    paymentTransactionId: firstTransaction.id,
                    direction: "credit",
                    amount: toAllocate.toFixed(2),
                    reason: "Переплата по договору",
                    createdBy: data.createdBy,
                });

                allocationSummary.push({
                    paymentItemId: selectedItem.id,
                    label: "Аванс ученика",
                    allocatedAmount: toAllocate,
                    kind: "advance_credit",
                });
            }

            const updatedItems = await tx
                .select({ amount: paymentItems.amount, paidAmount: paymentItems.paidAmount })
                .from(paymentItems)
                .where(eq(paymentItems.contractId, selectedItem.contractId));

            const contractRemaining = updatedItems.reduce((sum, item) => {
                return sum + Math.max(0, parseFloat(String(item.amount ?? "0")) - parseFloat(String(item.paidAmount ?? "0")));
            }, 0);
            const studentAdvanceBalance = await this.computeAdvanceBalanceTx(tx, contractContext.studentId);

            return {
                transaction: firstTransaction,
                newPaidAmount: selectedItemPaidAmount,
                newStatus: selectedItemStatus,
                contractRemaining,
                studentAdvanceBalance,
                allocationSummary,
                audit: {
                    oldValue: {
                        amount: data.amount,
                        payerName: data.payerName,
                        payerPhone: data.payerPhone ?? null,
                        contractRemaining: contractRemainingBefore,
                        studentAdvanceBalance: advanceBefore,
                    },
                    newValue: {
                        amount: data.amount,
                        payerName: data.payerName,
                        payerPhone: data.payerPhone ?? null,
                        contractRemaining,
                        studentAdvanceBalance,
                        source: data.source,
                        note: data.note ?? null,
                        allocationSummary,
                        contractNumber: contractContext.contractNumber ?? null,
                    },
                },
            };
        });
    }

    async reverseTransaction(transactionId: string, reason: string, userEmail: string): Promise<{
        transaction: PaymentTransaction;
        newPaidAmount: number;
        newStatus: string;
        contractRemaining: number;
        studentAdvanceBalance: number;
        allocationSummary: PaymentAllocationSummary[];
        audit: {
            oldValue: Record<string, unknown>;
            newValue: Record<string, unknown>;
        };
    }> {
        return await db.transaction(async (tx) => {
            const [transaction] = await tx
                .select()
                .from(paymentTransactions)
                .where(eq(paymentTransactions.id, transactionId));

            if (!transaction) throw new Error("Транзакция не найдена");
            if (transaction.isReversed) throw new Error("Транзакция уже отменена");

            const groupId = transaction.allocationGroupId ?? transaction.id;
            const groupTransactions = await tx
                .select()
                .from(paymentTransactions)
                .where(eq(paymentTransactions.allocationGroupId, groupId))
                .orderBy(asc(paymentTransactions.createdAt));

            const effectiveTransactions = groupTransactions.length > 0 ? groupTransactions : [transaction];
            if (effectiveTransactions.some((item) => item.isReversed)) {
                throw new Error("Часть транзакций этой группы уже отменена");
            }

            const [selectedItem] = await tx
                .select({
                    contractId: paymentItems.contractId,
                    amount: paymentItems.amount,
                    paidAmount: paymentItems.paidAmount,
                    dueDate: paymentItems.dueDate,
                    status: paymentItems.status,
                })
                .from(paymentItems)
                .where(eq(paymentItems.id, transaction.paymentItemId));

            if (!selectedItem) throw new Error("Платеж не найден");

            const [contractContext] = await tx
                .select({
                    contractId: contracts.id,
                    contractNumber: contracts.contractNumber,
                    studentId: enrollments.studentId,
                })
                .from(contracts)
                .innerJoin(enrollments, eq(contracts.enrollmentId, enrollments.id))
                .where(eq(contracts.id, selectedItem.contractId));

            if (!contractContext) throw new Error("Contract context not found");

            const contractItemsBefore = await tx
                .select({ amount: paymentItems.amount, paidAmount: paymentItems.paidAmount })
                .from(paymentItems)
                .where(eq(paymentItems.contractId, selectedItem.contractId));

            const contractRemainingBefore = contractItemsBefore.reduce((sum, item) => {
                return sum + Math.max(0, parseFloat(String(item.amount ?? "0")) - parseFloat(String(item.paidAmount ?? "0")));
            }, 0);
            const advanceBefore = await this.computeAdvanceBalanceTx(tx, contractContext.studentId);
            const allocationSummary: PaymentAllocationSummary[] = [];

            for (const groupTx of effectiveTransactions) {
                const [item] = await tx
                    .select()
                    .from(paymentItems)
                    .where(eq(paymentItems.id, groupTx.paymentItemId));

                if (!item) continue;

                const transactionAmount = parseFloat(String(groupTx.amount));
                const currentPaid = parseFloat(String(item.paidAmount ?? "0"));
                const totalAmount = parseFloat(String(item.amount ?? "0"));
                const newPaidAmount = Math.max(0, currentPaid - transactionAmount);
                const newStatus = computeStatus({
                    newPaidAmount,
                    totalAmount,
                    dueDate: item.dueDate,
                });

                await tx
                    .update(paymentItems)
                    .set({
                        paidAmount: newPaidAmount.toString(),
                        status: newStatus,
                    })
                    .where(eq(paymentItems.id, item.id));

                await tx
                    .update(paymentTransactions)
                    .set({
                        isReversed: true,
                        notes: reason,
                    })
                    .where(eq(paymentTransactions.id, groupTx.id));

                allocationSummary.push({
                    paymentItemId: item.id,
                    label: item.label ?? "Платеж",
                    allocatedAmount: transactionAmount,
                    kind: `reversal:${groupTx.kind}`,
                });
            }

            const creditedEntries = await tx
                .select()
                .from(studentCreditLedger)
                .where(eq(studentCreditLedger.paymentTransactionId, effectiveTransactions[0].id));

            for (const entry of creditedEntries) {
                if (entry.direction !== "credit") continue;
                await tx.insert(studentCreditLedger).values({
                    studentId: entry.studentId,
                    contractId: entry.contractId,
                    paymentTransactionId: entry.paymentTransactionId,
                    direction: "debit",
                    amount: entry.amount,
                    reason: `Сторно переплаты: ${reason}`,
                    createdBy: userEmail,
                });

                allocationSummary.push({
                    paymentItemId: effectiveTransactions[0].paymentItemId,
                    label: "Аванс ученика",
                    allocatedAmount: parseFloat(String(entry.amount)),
                    kind: "advance_reversal",
                });
            }

            const [updatedPrimaryTransaction] = await tx
                .select()
                .from(paymentTransactions)
                .where(eq(paymentTransactions.id, transactionId));

            const [updatedSelectedItem] = await tx
                .select()
                .from(paymentItems)
                .where(eq(paymentItems.id, transaction.paymentItemId));

            if (!updatedPrimaryTransaction || !updatedSelectedItem) {
                throw new Error("Не удалось обновить сторно");
            }

            const updatedItems = await tx
                .select({ amount: paymentItems.amount, paidAmount: paymentItems.paidAmount })
                .from(paymentItems)
                .where(eq(paymentItems.contractId, selectedItem.contractId));

            const contractRemaining = updatedItems.reduce((sum, item) => {
                return sum + Math.max(0, parseFloat(String(item.amount ?? "0")) - parseFloat(String(item.paidAmount ?? "0")));
            }, 0);
            const studentAdvanceBalance = await this.computeAdvanceBalanceTx(tx, contractContext.studentId);

            return {
                transaction: updatedPrimaryTransaction,
                newPaidAmount: parseFloat(String(updatedSelectedItem.paidAmount ?? "0")),
                newStatus: updatedSelectedItem.status,
                contractRemaining,
                studentAdvanceBalance,
                allocationSummary,
                audit: {
                    oldValue: {
                        reason,
                        contractRemaining: contractRemainingBefore,
                        studentAdvanceBalance: advanceBefore,
                        allocationSummary: effectiveTransactions.map((item) => ({
                            paymentItemId: item.paymentItemId,
                            allocatedAmount: parseFloat(String(item.amount)),
                            kind: item.kind,
                        })),
                    },
                    newValue: {
                        reason,
                        contractRemaining,
                        studentAdvanceBalance,
                        allocationSummary,
                        contractNumber: contractContext.contractNumber ?? null,
                    },
                },
            };
        });
    }

    async getByPaymentItemId(paymentItemId: string): Promise<PaymentTransaction[]> {
        return db
            .select()
            .from(paymentTransactions)
            .where(eq(paymentTransactions.paymentItemId, paymentItemId))
            .orderBy(desc(paymentTransactions.paidAt));
    }

    async getByContractId(contractId: string): Promise<PaymentTransaction[]> {
        const items = await db
            .select({ id: paymentItems.id })
            .from(paymentItems)
            .where(eq(paymentItems.contractId, contractId));

        if (items.length === 0) return [];

        return db
            .select()
            .from(paymentTransactions)
            .where(inArray(paymentTransactions.paymentItemId, items.map(i => i.id)))
            .orderBy(desc(paymentTransactions.paidAt));
    }

    async getStudentAdvanceSummary(studentId: string): Promise<StudentAdvanceSummary> {
        const rows = await db
            .select({
                balance: sql<number>`coalesce(sum(case when ${studentCreditLedger.direction} = 'credit' then ${studentCreditLedger.amount} else -${studentCreditLedger.amount} end), 0)`,
                lastEntryAt: sql<string | null>`max(${studentCreditLedger.createdAt})`,
            })
            .from(studentCreditLedger)
            .where(eq(studentCreditLedger.studentId, studentId));

        const [latestEntry] = await db
            .select({
                reason: studentCreditLedger.reason,
            })
            .from(studentCreditLedger)
            .where(eq(studentCreditLedger.studentId, studentId))
            .orderBy(desc(studentCreditLedger.createdAt))
            .limit(1);

        return {
            balance: Number(rows[0]?.balance ?? 0),
            lastEntryAt: rows[0]?.lastEntryAt ?? null,
            lastReason: latestEntry?.reason ?? null,
        };
    }

    private async computeAdvanceBalanceTx(tx: Parameters<typeof db.transaction>[0] extends (arg: infer T) => Promise<unknown> ? T : never, studentId: string): Promise<number> {
        const rows = await tx
            .select({
                balance: sql<number>`coalesce(sum(case when ${studentCreditLedger.direction} = 'credit' then ${studentCreditLedger.amount} else -${studentCreditLedger.amount} end), 0)`,
            })
            .from(studentCreditLedger)
            .where(eq(studentCreditLedger.studentId, studentId));

        return Number(rows[0]?.balance ?? 0);
    }
}

export const paymentRepository = new PaymentRepository();
