import { BaseRepository } from "./base.repo";
import { db } from "../index";
import { contracts, type Contract, type NewContract } from "../schema/contracts";
import { paymentItems, type NewPaymentItem } from "../schema/payment-items";
import { enrollments } from "../schema/enrollments";
import { eq, inArray, desc, asc, and } from "drizzle-orm";

export interface ContractDetail {
    id: string;
    contractNumber: string;
    enrollmentId: string;
    studentId: string;
    startedAt: string;
    basePrice: number;
    discountAmount: number;
    prepaymentAmount: number;
    paymentMode: string;
    paymentDueDay: number;
    totalAmount: number;
    status: string;
    previousContractId: string | null;
    createdAt: string;
}

export interface PaymentItemDetail {
    id: string;
    contractId: string;
    label: string;
    dueDate: string;
    amountExpected: number;
    amountPaid: number;
    status: string;
}

export interface NewContractData {
    contractNumber: string;
    enrollmentId: string;
    startedAt: Date;
    basePrice: number;
    discountAmount: number;
    prepaymentAmount: number;
    paymentMode: string;
    paymentDueDay: number;
    status?: string;
    previousContractId?: string | null;
    paymentItems: Array<{
        label: string;
        dueDate: Date;
        amount: number;
    }>;
}

export class ContractRepository extends BaseRepository<typeof contracts, Contract, NewContract> {
    constructor() {
        super(contracts);
    }

    async getByStudentId(studentId: string, targetContractId?: string): Promise<{
        contract: ContractDetail | null;
        paymentItems: PaymentItemDetail[];
    }> {
        // 1. Get enrollments for the student
        const studentEnrollments = await db
            .select({ id: enrollments.id })
            .from(enrollments)
            .where(eq(enrollments.studentId, studentId));

        if (studentEnrollments.length === 0) return { contract: null, paymentItems: [] };
        const enrollmentIds = studentEnrollments.map(e => e.id);

        // 2. Get contract linked to the enrollment(s) or the specific contract requested
        const condition = targetContractId
            ? eq(contracts.id, targetContractId)
            : and(inArray(contracts.enrollmentId, enrollmentIds), eq(contracts.status, "active"));

        const [contractData] = await db
            .select()
            .from(contracts)
            .where(condition)
            .orderBy(desc(contracts.createdAt))
            .limit(1);

        if (!contractData) return { contract: null, paymentItems: [] };
        
        // Security check: ensure the requested contract actually belongs to one of the student's enrollments
        if (targetContractId && !enrollmentIds.includes(contractData.enrollmentId)) {
             return { contract: null, paymentItems: [] };
        }

        const basePrice = parseFloat(contractData.basePrice);
        const discountAmount = parseFloat(contractData.discountAmount);

        const contract: ContractDetail = {
            id: contractData.id,
            contractNumber: contractData.contractNumber ?? "",
            enrollmentId: contractData.enrollmentId,
            studentId,
            startedAt: contractData.startedAt,
            basePrice,
            discountAmount,
            prepaymentAmount: parseFloat(contractData.prepaymentAmount),
            paymentMode: contractData.paymentMode,
            paymentDueDay: contractData.paymentDueDay,
            totalAmount: basePrice - discountAmount,
            status: contractData.status,
            previousContractId: contractData.previousContractId,
            createdAt: contractData.createdAt.toISOString(),
        };

        // 3. Get payment items
        const itemsData = await db
            .select()
            .from(paymentItems)
            .where(eq(paymentItems.contractId, contract.id))
            .orderBy(asc(paymentItems.dueDate));

        const formattedPaymentItems: PaymentItemDetail[] = itemsData.map(item => ({
            id: item.id,
            contractId: item.contractId,
            label: item.label ?? "",
            dueDate: item.dueDate,
            amountExpected: parseFloat(item.amount),
            amountPaid: parseFloat(item.paidAmount),
            status: item.status,
        }));

        return { contract, paymentItems: formattedPaymentItems };
    }

    async createContractWithItems(data: NewContractData): Promise<ContractDetail> {
        // We use a transaction to ensure both contract and payment items are created together
        return await db.transaction(async (tx) => {
            // 1. Get student ID from enrollment for returning the detail (we only read, so no lock needed)
            const [enrollment] = await tx
                .select({ studentId: enrollments.studentId })
                .from(enrollments)
                .where(eq(enrollments.id, data.enrollmentId));

            if (!enrollment) throw new Error("Enrollment not found");

            // 2. Insert contract
            const [contractData] = await tx
                .insert(contracts)
                .values({
                    contractNumber: data.contractNumber,
                    enrollmentId: data.enrollmentId,
                    startedAt: data.startedAt.toISOString().split("T")[0],
                    basePrice: data.basePrice.toString(),
                    discountAmount: data.discountAmount.toString(),
                    prepaymentAmount: data.prepaymentAmount.toString(),
                    paymentMode: data.paymentMode,
                    paymentDueDay: data.paymentDueDay,
                    status: data.status ?? "active",
                    previousContractId: data.previousContractId ?? null,
                })
                .returning();

            // 3. Insert payment items if any
            if (data.paymentItems.length > 0) {
                const itemsPayload: NewPaymentItem[] = data.paymentItems.map((item) => ({
                    contractId: contractData.id,
                    label: item.label,
                    dueDate: item.dueDate.toISOString().split("T")[0],
                    amount: item.amount.toString(),
                    paidAmount: "0",
                    status: "planned",
                }));

                await tx.insert(paymentItems).values(itemsPayload);
            }

            const basePrice = parseFloat(contractData.basePrice);
            const discountAmount = parseFloat(contractData.discountAmount);

            return {
                id: contractData.id,
                contractNumber: contractData.contractNumber ?? "",
                enrollmentId: contractData.enrollmentId,
                studentId: enrollment.studentId,
                startedAt: contractData.startedAt,
                basePrice,
                discountAmount,
                prepaymentAmount: parseFloat(contractData.prepaymentAmount),
                paymentMode: contractData.paymentMode,
                paymentDueDay: contractData.paymentDueDay,
                totalAmount: basePrice - discountAmount,
                status: contractData.status,
                previousContractId: contractData.previousContractId,
                createdAt: contractData.createdAt.toISOString(),
            };
        });
    }

    async getAllByStudentId(studentId: string): Promise<ContractDetail[]> {
        // 1. Get enrollments for the student
        const studentEnrollments = await db
            .select({ id: enrollments.id })
            .from(enrollments)
            .where(eq(enrollments.studentId, studentId));

        if (studentEnrollments.length === 0) return [];
        const enrollmentIds = studentEnrollments.map(e => e.id);

        // 2. Get all contracts linked to student's enrollments
        const contractDataList = await db
            .select()
            .from(contracts)
            .where(inArray(contracts.enrollmentId, enrollmentIds))
            .orderBy(desc(contracts.createdAt));

        return contractDataList.map(contractData => {
            const basePrice = parseFloat(contractData.basePrice);
            const discountAmount = parseFloat(contractData.discountAmount);

            return {
                id: contractData.id,
                contractNumber: contractData.contractNumber ?? "",
                enrollmentId: contractData.enrollmentId,
                studentId,
                startedAt: contractData.startedAt,
                basePrice,
                discountAmount,
                prepaymentAmount: parseFloat(contractData.prepaymentAmount),
                paymentMode: contractData.paymentMode,
                paymentDueDay: contractData.paymentDueDay,
                totalAmount: basePrice - discountAmount,
                status: contractData.status,
                previousContractId: contractData.previousContractId,
                createdAt: contractData.createdAt.toISOString(),
            };
        });
    }
}

export const contractRepository = new ContractRepository();
