import { NextRequest, NextResponse } from 'next/server';
import { enforcePermission, resolveRole } from '@/lib/authz';
import { writeAuditLog } from '@/lib/audit-store';
import { deleteWithdrawalCase, getWithdrawalCaseById, updateWithdrawalCase } from '@/lib/finance-store';

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const forbidden = enforcePermission(request, 'withdrawals.write');
  if (forbidden) return forbidden;

  const { id } = await params;
  const before = await getWithdrawalCaseById(id);
  if (!before) return NextResponse.json({ error: 'Withdrawal case not found' }, { status: 404 });

  const body = (await request.json()) as {
    reason?: string;
    effectiveDate?: string;
    settlementType?: 'refund' | 'debt' | 'zero';
    settlementAmount?: number;
  };

  const updated = await updateWithdrawalCase(id, {
    ...body,
    approvedBy: resolveRole(request)
  });

  if (!updated) return NextResponse.json({ error: 'Withdrawal case not found' }, { status: 404 });

  await writeAuditLog({
    entityType: 'withdrawal_case',
    entityId: id,
    action: 'update',
    actor: resolveRole(request),
    oldValue: before,
    newValue: updated
  });

  return NextResponse.json({ data: updated });
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const forbidden = enforcePermission(request, 'withdrawals.write');
  if (forbidden) return forbidden;

  const { id } = await params;
  const before = await getWithdrawalCaseById(id);
  if (!before) return NextResponse.json({ error: 'Withdrawal case not found' }, { status: 404 });

  await deleteWithdrawalCase(id);

  await writeAuditLog({
    entityType: 'withdrawal_case',
    entityId: id,
    action: 'delete',
    actor: resolveRole(request),
    oldValue: before
  });

  return NextResponse.json({ ok: true });
}
