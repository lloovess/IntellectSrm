import { supabaseServer } from '@/lib/supabase-server';
import { summarizeAuditDiff } from '@/lib/audit/utils';

export async function writeAuditLog(input: {
  entityType: string;
  entityId: string | null;
  action: string;
  actor: string;
  oldValue?: unknown;
  newValue?: unknown;
  metadata?: Record<string, unknown>;
}) {
  const { error } = await supabaseServer.from('audit_logs').insert({
    id: crypto.randomUUID(),
    entity_type: input.entityType,
    entity_id: input.entityId,
    action: input.action,
    old_value: input.oldValue ?? null,
    new_value: input.newValue ?? input.metadata ?? null,
    actor: input.actor
  });

  if (error) {
    throw new Error(`Failed to write audit log: ${error.message}`);
  }
}

export function buildAuditSummary(input: {
  action: string;
  oldValue?: unknown;
  newValue?: unknown;
}) {
  return summarizeAuditDiff(input.oldValue, input.newValue).join('; ') || input.action;
}
