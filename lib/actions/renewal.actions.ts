"use server";

import { revalidatePath } from "next/cache";
import { requireAuth } from "@/lib/auth/session";
import { contractService, type RenewContractInput } from "@/lib/services/contract.service";
import { ZodError } from "zod";
import { writeAuditLog } from "@/lib/audit-store";

export type ActionResult<T = void> =
    | { ok: true; data: T }
    | { ok: false; error: string };

/**
 * Server Action: продление договора.
 * Closes the old enrollment+contract, creates a new one.
 */
export async function renewContractAction(
    input: Omit<RenewContractInput, "studentId"> & { studentId: string }
): Promise<ActionResult<{ contractId: string }>> {
    try {
        const { role, email } = await requireAuth();

        const contract = await contractService.renewContract(input, role);

        await writeAuditLog({
            entityType: "contract",
            entityId: contract.id,
            action: "renew",
            actor: email,
            newValue: {
                contractId: contract.id,
                contractNumber: contract.contractNumber,
                previousContractId: contract.previousContractId,
                paymentMode: contract.paymentMode,
                startedAt: contract.startedAt,
            },
        });

        revalidatePath(`/students/${input.studentId}/contract`);
        revalidatePath(`/students/${input.studentId}`);

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
