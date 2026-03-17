"use server";

import { z } from "zod";
import { revalidatePath, revalidateTag } from "next/cache";
import { withdrawalService } from "@/lib/services/withdrawal.service";

const createSchema = z.object({
    enrollmentId: z.string().uuid("Выберите ученика"),
    reason: z.string().min(3, "Укажите причину отчисления"),
    effectiveDate: z.string().min(1, "Укажите дату отчисления"),
    settlementType: z.string().default("prorated"),
});

export async function createWithdrawalAction(prev: unknown, formData: FormData) {
    const raw = {
        enrollmentId: formData.get("enrollmentId") as string,
        reason: formData.get("reason") as string,
        effectiveDate: formData.get("effectiveDate") as string,
        settlementType: "prorated",
    };

    const parsed = createSchema.safeParse(raw);
    if (!parsed.success) {
        return { ok: false as const, error: parsed.error.issues[0].message };
    }

    try {
        const result = await withdrawalService.createCase(parsed.data);
        revalidatePath("/withdrawals");
        revalidateTag('dashboard_metrics');
        return { ok: true as const, id: result.id, settlement: result.settlement };
    } catch (err) {
        return { ok: false as const, error: err instanceof Error ? err.message : "Ошибка создания" };
    }
}

export async function approveWithdrawalAction(id: string) {
    try {
        await withdrawalService.approveCase(id);
        revalidatePath("/withdrawals");
        revalidateTag('dashboard_metrics');
        return { ok: true as const };
    } catch (err) {
        return { ok: false as const, error: err instanceof Error ? err.message : "Ошибка апрува" };
    }
}
