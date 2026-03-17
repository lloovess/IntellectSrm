import { NextRequest, NextResponse } from 'next/server';
import { enforcePermission, resolveRole } from '@/lib/authz';
import { writeAuditLog } from '@/lib/audit-store';
import { deleteContract, getContractById, updateContract } from '@/lib/finance-store';
import { getCurrentUser } from '@/lib/auth/session';

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const forbidden = enforcePermission(request, 'contracts.write');
  if (forbidden) return forbidden;

  const { id } = await params;
  const before = await getContractById(id);
  if (!before) return NextResponse.json({ error: 'Contract not found' }, { status: 404 });

  const body = (await request.json()) as {
    basePrice?: number;
    discountAmount?: number;
    prepaymentAmount?: number;
    paymentMode?: 'one_time' | 'monthly';
    startedAt?: string;
  };

  const updated = await updateContract(id, body);
  if (!updated) return NextResponse.json({ error: 'Contract not found' }, { status: 404 });
  const currentUser = await getCurrentUser();

  await writeAuditLog({
    entityType: 'contract',
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
  const before = await getContractById(id);
  if (!before) return NextResponse.json({ error: 'Contract not found' }, { status: 404 });
  const currentUser = await getCurrentUser();

  await deleteContract(id);

  await writeAuditLog({
    entityType: 'contract',
    entityId: id,
    action: 'delete',
    actor: currentUser?.email ?? resolveRole(request),
    oldValue: before
  });

  return NextResponse.json({ ok: true });
}
