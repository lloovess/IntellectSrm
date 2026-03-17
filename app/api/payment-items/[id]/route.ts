import { NextRequest, NextResponse } from 'next/server';
import { enforcePermission, resolveRole } from '@/lib/authz';
import { writeAuditLog } from '@/lib/audit-store';
import { deletePaymentItem, getPaymentItemById, updatePaymentItem } from '@/lib/finance-store';
import { PaymentItemStatus } from '@/lib/domain';
import { getCurrentUser } from '@/lib/auth/session';

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const forbidden = enforcePermission(request, 'contracts.write');
  if (forbidden) return forbidden;

  const { id } = await params;
  const before = await getPaymentItemById(id);
  if (!before) return NextResponse.json({ error: 'Payment item not found' }, { status: 404 });

  const body = (await request.json()) as {
    label?: string;
    dueDate?: string;
    amount?: number;
    paidAmount?: number;
    status?: PaymentItemStatus;
  };

  const updated = await updatePaymentItem(id, body);
  if (!updated) return NextResponse.json({ error: 'Payment item not found' }, { status: 404 });
  const currentUser = await getCurrentUser();

  await writeAuditLog({
    entityType: 'payment_item',
    entityId: id,
    action: 'update',
    actor: currentUser?.email ?? resolveRole(request),
    oldValue: before,
    newValue: updated
  });

  return NextResponse.json({ data: updated });
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const forbidden = enforcePermission(request, 'contracts.write');
  if (forbidden) return forbidden;

  const { id } = await params;
  const before = await getPaymentItemById(id);
  if (!before) return NextResponse.json({ error: 'Payment item not found' }, { status: 404 });
  const currentUser = await getCurrentUser();

  await deletePaymentItem(id);

  await writeAuditLog({
    entityType: 'payment_item',
    entityId: id,
    action: 'delete',
    actor: currentUser?.email ?? resolveRole(request),
    oldValue: before
  });

  return NextResponse.json({ ok: true });
}
