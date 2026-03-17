"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { requireAuth } from "@/lib/auth/session";
import { contractService } from "@/lib/services/contract.service";
import { createContractSchema, updatePaymentTermsSchema } from "@/lib/validators/contract.schema";
import { db } from "@/lib/db";
import { guardians } from "@/lib/db/schema/guardians";
import { eq } from "drizzle-orm";
import { ZodError } from "zod";

export type ActionResult<T = void> =
    | { ok: true; data: T }
    | { ok: false; error: string };

/**
 * Server Action: создать договор + платёжный план.
 * AGENTS rule #3: все мутации через Server Actions.
 */
export async function createContractAction(
    formData: Record<string, unknown>
): Promise<ActionResult<{ contractId: string }>> {
    try {
        const { role } = await requireAuth();

        // Zod parse from raw form data
        const parsed = createContractSchema.parse({
            ...formData,
            basePrice: Number(formData.basePrice),
            discountPercent: Number(formData.discountPercent ?? 0),
            prepayPercent: Number(formData.prepayPercent ?? 0),
            months: Number(formData.months ?? 10),
        });

        // Optional: Update guardian details if provided
        if (parsed.guardianId && parsed.guardianFullName) {
            await db.update(guardians).set({
                fullName: parsed.guardianFullName,
                iin: parsed.guardianIin || null,
                passport: parsed.guardianPassport || null,
                address: parsed.guardianAddress || null,
                phone: parsed.guardianPhone || "",
            }).where(eq(guardians.id, parsed.guardianId));
        }

        const contract = await contractService.createContract(parsed, role);

        revalidatePath(`/students/${parsed.studentId}/contract`);
        revalidatePath(`/students/${parsed.studentId}`);
        revalidateTag('dashboard_metrics');

        return { ok: true, data: { contractId: contract.id } };
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

export async function recalculateContractBalanceAction(input: {
    contractId: string;
    studentId: string; // for revalidating the contract page
}): Promise<ActionResult<{ diff: number }>> {
    try {
        const { role } = await requireAuth();

        const result = await contractService.recalculateContractBalance(input.contractId, role);

        revalidatePath(`/students/${input.studentId}/contract`);
        revalidatePath('/', 'layout');
        revalidateTag('dashboard_metrics');

        return {
            ok: true,
            data: result,
        };
    } catch (err) {
        if (err instanceof Error) {
            return { ok: false, error: err.message };
        }
        return { ok: false, error: "Неизвестная ошибка" };
    }
}

export async function generatePaymentScheduleAction(input: {
    contractId: string;
    studentId: string; // for revalidating the contract page
    months?: number; // optional parameter to define months to distribute
}): Promise<ActionResult> {
    try {
        const { role } = await requireAuth();

        await contractService.generatePaymentSchedule(input.contractId, role, input.months);

        revalidatePath(`/students/${input.studentId}/contract`);
        revalidatePath('/', 'layout');
        revalidateTag('dashboard_metrics');

        return {
            ok: true,
            data: undefined,
        };
    } catch (err) {
        if (err instanceof Error) {
            return { ok: false, error: err.message };
        }
        return { ok: false, error: "Неизвестная ошибка" };
    }
}

export async function updatePaymentTermsAndRegenerateAction(input: {
    contractId: string;
    studentId: string;
    paymentMode: "monthly" | "quarterly" | "annual";
    months: number;
    paymentDueDay: number;
}): Promise<ActionResult> {
    try {
        const { role } = await requireAuth();
        const parsed = updatePaymentTermsSchema.parse(input);

        await contractService.updatePaymentTermsAndRegenerate({
            contractId: parsed.contractId,
            paymentMode: parsed.paymentMode,
            months: parsed.months,
            paymentDueDay: parsed.paymentDueDay,
            role,
        });

        revalidatePath(`/students/${parsed.studentId}/contract`);
        revalidatePath('/', 'layout');
        revalidateTag('dashboard_metrics');

        return { ok: true, data: undefined };
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
