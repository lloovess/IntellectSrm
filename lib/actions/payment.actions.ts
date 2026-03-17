"use server";

import { requireAuth } from "@/lib/auth/session";
import { paymentService } from "@/lib/services/payment.service";
import { revalidatePath, revalidateTag } from "next/cache";
import { ZodError } from "zod";

type ActionResult =
    | {
        ok: true; data: {
            newStatus: string;
            newPaidAmount: number;
            contractRemaining: number;
            studentAdvanceBalance: number;
            allocationSummary: Array<{
                paymentItemId: string;
                label: string;
                allocatedAmount: number;
                kind: string;
            }>;
        }
    }
    | { ok: false; error: string };

export async function recordPaymentAction(input: {
    paymentItemId: string;
    amount: number;
    source: string;
    payerName: string;
    payerPhone?: string;
    note?: string;
    paidAt?: string;
    studentId: string; // for revalidating the contract page
}): Promise<ActionResult> {
    try {
        const { role, id, email } = await requireAuth();

        const result = await paymentService.recordPayment(
            {
                paymentItemId: input.paymentItemId,
                amount: input.amount,
                source: input.source as "cash" | "kaspi" | "bank_transfer",
                payerName: input.payerName,
                payerPhone: input.payerPhone,
                note: input.note,
                paidAt: input.paidAt,
            },
            role,
            id,
            email
        );

        revalidatePath(`/students/${input.studentId}/contract`);
        revalidatePath('/', 'layout'); // Ensure all role specific dashboards (like /assistant) are refreshed
        revalidateTag('dashboard_metrics');

        return {
            ok: true,
            data: {
                newStatus: result.newStatus,
                newPaidAmount: result.newPaidAmount,
                contractRemaining: result.contractRemaining,
                studentAdvanceBalance: result.studentAdvanceBalance,
                allocationSummary: result.allocationSummary,
            },
        };
    } catch (err) {
        if (err instanceof ZodError) {
            const first = err.issues[0];
            return { ok: false, error: first?.message ?? "Ошибка валидации" };
        }
        if (err instanceof Error) {
            return { ok: false, error: err.message };
        }
        return { ok: false, error: "Неизвестная ошибка" };
    }
}

export async function reversePaymentTransactionAction(input: {
    transactionId: string;
    reason: string;
    studentId: string; // for revalidating the contract page
}): Promise<ActionResult> {
    try {
        const { role, id, email } = await requireAuth();

        const result = await paymentService.reversePayment(
            {
                transactionId: input.transactionId,
                reason: input.reason,
            },
            role,
            id,
            email
        );

        revalidatePath(`/students/${input.studentId}/contract`);
        revalidatePath('/', 'layout'); // Ensure all role specific dashboards (like /assistant) are refreshed
        revalidateTag('dashboard_metrics');

        return {
            ok: true,
            data: {
                newStatus: result.newStatus,
                newPaidAmount: result.newPaidAmount,
                contractRemaining: result.contractRemaining,
                studentAdvanceBalance: result.studentAdvanceBalance,
                allocationSummary: result.allocationSummary,
            },
        };
    } catch (err) {
        if (err instanceof ZodError) {
            const first = err.issues[0];
            return { ok: false, error: first?.message ?? "Ошибка валидации" };
        }
        if (err instanceof Error) {
            return { ok: false, error: err.message };
        }
        return { ok: false, error: "Неизвестная ошибка" };
    }
}
