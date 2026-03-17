import { desc } from "drizzle-orm";
import { db } from "../index";
import { auditLogs, type AuditLog, type NewAuditLog } from "../schema/audit-logs";
import { BaseRepository } from "./base.repo";

export class AuditRepository extends BaseRepository<typeof auditLogs, AuditLog, NewAuditLog> {
    constructor() {
        super(auditLogs);
    }

    async findRecent(limit = 100): Promise<AuditLog[]> {
        return db
            .select()
            .from(auditLogs)
            .orderBy(desc(auditLogs.createdAt))
            .limit(limit);
    }
}

export const auditRepository = new AuditRepository();
