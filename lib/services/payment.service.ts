import { paymentRepository, type PaymentTransaction } from "@/lib/db/repositories/payment.repo";
import { recordPaymentSchema, type RecordPaymentInput, reversePaymentSchema, type ReversePaymentInput } from "@/lib/validators/payment.schema";
import { createAdminClient } from "@/lib/supabase/server";
import { checkPermission } from "@/lib/auth/guard";
import type { Role } from "@/lib/auth/config";
import { buildAuditDiff } from "@/lib/audit/utils";

// ─── Service ──────────────────────────────────────────────────────────────────

export class PaymentService {
    /**
     * Records a payment: validates, checks RBAC, calls repo, writes audit log.
     */
    async recordPayment(
        input: RecordPaymentInput,
        role: Role,
        userId: string,
        userEmail: string
    ): Promise<{
        transaction: PaymentTransaction;
        newPaidAmount: number;
        newStatus: string;
        contractRemaining: number;
        studentAdvanceBalance: number;
        allocationSummary: Array<{
            paymentItemId: string;
            label: string;
            allocatedAmount: number;
            kind: string;
        }>;
    }> {
        if (!checkPermission(role, "payments.write")) {
            throw new Error("Недостаточно прав для записи оплаты");
        }

        const parsed = recordPaymentSchema.parse(input);

        const result = await paymentRepository.recordPayment({
            paymentItemId: parsed.paymentItemId,
            amount: parsed.amount,
            source: parsed.source,
            payerName: parsed.payerName,
            payerPhone: parsed.payerPhone,
            note: parsed.note,
            paidAt: parsed.paidAt ? new Date(parsed.paidAt) : undefined,
            createdBy: userEmail,
        });

        // Write audit log
        await this.writeAuditLog({
            userId,
            userEmail,
            action: "payment_recorded",
            entityType: "payment_items",
            entityId: parsed.paymentItemId,
            meta: {
                summary: buildAuditDiff(result.audit.oldValue, result.audit.newValue),
                ...result.audit.newValue,
            },
            oldValue: result.audit.oldValue,
            newValue: result.audit.newValue,
        });
        return result;
    }

    /**
     * Reverses a payment transaction (Storno)
     */
    async reversePayment(
        input: ReversePaymentInput,
        role: Role,
        userId: string,
        userEmail: string
    ): Promise<{
        transaction: PaymentTransaction;
        newPaidAmount: number;
        newStatus: string;
        contractRemaining: number;
        studentAdvanceBalance: number;
        allocationSummary: Array<{
            paymentItemId: string;
            label: string;
            allocatedAmount: number;
            kind: string;
        }>;
    }> {
        if (!checkPermission(role, "payments.write")) {
            throw new Error("Недостаточно прав для отмены оплаты");
        }

        const parsed = reversePaymentSchema.parse(input);

        // Execute DB transaction for Storno
        const result = await paymentRepository.reverseTransaction(
            parsed.transactionId,
            parsed.reason,
            userEmail
        );

        // Write audit log
        await this.writeAuditLog({
            userId,
            userEmail,
            action: "payment_reversed",
            entityType: "payment_items",
            entityId: result.transaction.paymentItemId,
            meta: {
                summary: buildAuditDiff(result.audit.oldValue, result.audit.newValue),
                ...result.audit.newValue,
            },
            oldValue: result.audit.oldValue,
            newValue: result.audit.newValue,
        });

        return result;
    }

    /**
     * Fetch transaction history for a specific payment item.
     */
    async getTransactionsByItem(
        paymentItemId: string,
        role: Role
    ): Promise<PaymentTransaction[]> {
        if (!checkPermission(role, "payments.read")) return [];
        return paymentRepository.getByPaymentItemId(paymentItemId);
    }

    private async writeAuditLog(data: {
        userId: string;
        userEmail: string;
        action: string;
        entityType: string;
        entityId: string;
        meta?: Record<string, unknown>;
        oldValue?: Record<string, unknown>;
        newValue?: Record<string, unknown>;
    }) {
        try {
            const admin = await createAdminClient();
            await admin.from("audit_logs").insert({
                entity_type: data.entityType,
                entity_id: data.entityId,
                action: data.action,
                actor: data.userEmail,           // real column: actor (text)
                old_value: data.oldValue ?? null,
                new_value: data.newValue ?? data.meta ?? {},      // real column: new_value (jsonb)
            });
        } catch {
            // Audit log failures should not block the main operation
            console.error("[audit] Failed to write audit log:", data);
        }
    }
}

export const paymentService = new PaymentService();
