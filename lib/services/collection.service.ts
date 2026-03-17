import { collectionRepository, type CollectionQueueRow, type CollectionStats } from "@/lib/db/repositories/collection.repo";
import { createAdminClient } from "@/lib/supabase/server";
import { checkPermission } from "@/lib/auth/guard";
import type { Role } from "@/lib/auth/config";

export interface CollectionPageData {
    rows: CollectionQueueRow[];
    stats: CollectionStats;
}

export class CollectionService {
    async getCollectionPage(role: Role): Promise<CollectionPageData> {
        if (!checkPermission(role, "collections.read")) {
            return { rows: [], stats: { totalDebt: 0, activeTasks: 0, resolvedToday: 0 } };
        }
        const [rows, stats] = await Promise.all([
            collectionRepository.getQueue(),
            collectionRepository.getStats(),
        ]);
        return { rows, stats };
    }

    async updateTaskStatus(
        taskId: string,
        status: string,
        note: string,
        role: Role,
        userEmail: string
    ): Promise<void> {
        if (!checkPermission(role, "collections.write")) {
            throw new Error("Недостаточно прав");
        }
        await collectionRepository.updateTaskStatus(taskId, status, note);
        await this.writeAuditLog({
            entityType: "collection_tasks",
            entityId: taskId,
            action: "task_status_updated",
            actor: userEmail,
            newValue: { status, note },
        });
    }

    async ensureTask(
        studentId: string,
        paymentItemId: string,
        role: Role
    ): Promise<string> {
        if (!checkPermission(role, "collections.write")) {
            throw new Error("Недостаточно прав");
        }
        return collectionRepository.createTask(studentId, paymentItemId);
    }

    private async writeAuditLog(data: {
        entityType: string;
        entityId: string;
        action: string;
        actor: string;
        newValue?: Record<string, unknown>;
    }) {
        try {
            const admin = await createAdminClient();
            await admin.from("audit_logs").insert({
                entity_type: data.entityType,
                entity_id: data.entityId,
                action: data.action,
                actor: data.actor,
                new_value: data.newValue ?? {},
            });
        } catch {
            console.error("[audit] Failed to write audit log");
        }
    }
}

export const collectionService = new CollectionService();
