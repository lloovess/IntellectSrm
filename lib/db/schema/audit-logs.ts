import { pgTable, uuid, text, timestamp, jsonb } from "drizzle-orm/pg-core";

// Synced with real DB schema: 2026-03-01
// Real columns: id, entity_type, entity_id (uuid), action, old_value, new_value, actor, created_at
// NOT in DB: user_id, details, ip_address, user_agent

export const auditLogs = pgTable("audit_logs", {
    id: uuid("id").primaryKey().defaultRandom(),
    entityType: text("entity_type").notNull(), // students | contracts | payment_items | ...
    entityId: uuid("entity_id").notNull(),
    action: text("action").notNull(),      // payment_recorded | contract_created | ...
    oldValue: jsonb("old_value"),            // nullable — state before change
    newValue: jsonb("new_value"),            // nullable — state after change
    actor: text("actor").notNull(),       // user email or system identifier
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export type AuditLog = typeof auditLogs.$inferSelect;
export type NewAuditLog = typeof auditLogs.$inferInsert;
