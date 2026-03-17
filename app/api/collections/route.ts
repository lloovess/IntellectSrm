import { NextRequest, NextResponse } from 'next/server';
import { enforcePermission, resolveRole } from '@/lib/authz';
import { writeAuditLog } from '@/lib/audit-store';
import { upsertCollectionTask } from '@/lib/finance-store';
import { CollectionStatus } from '@/lib/domain';

export async function POST(request: NextRequest) {
  const forbidden = enforcePermission(request, 'collections.write');
  if (forbidden) return forbidden;

  const body = (await request.json()) as {
    studentId?: string;
    paymentItemId?: string;
    status?: CollectionStatus;
    note?: string;
  };

  if (!body.studentId || !body.paymentItemId || !body.status || !body.note) {
    return NextResponse.json({ error: 'studentId, paymentItemId, status, note are required' }, { status: 400 });
  }

  const result = await upsertCollectionTask({
    studentId: body.studentId,
    paymentItemId: body.paymentItemId,
    status: body.status,
    note: body.note
  });

  await writeAuditLog({
    entityType: 'collection_task',
    entityId: result.after.id,
    action: result.before ? 'update' : 'create',
    actor: resolveRole(request),
    oldValue: result.before,
    newValue: result.after
  });

  return NextResponse.json({ data: result.after }, { status: result.before ? 200 : 201 });
}
