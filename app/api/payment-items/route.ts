import { NextRequest, NextResponse } from 'next/server';
import { enforcePermission, resolveRole } from '@/lib/authz';
import { writeAuditLog } from '@/lib/audit-store';
import { createPaymentItem } from '@/lib/finance-store';
import { PaymentItemStatus } from '@/lib/domain';
import { getCurrentUser } from '@/lib/auth/session';

export async function POST(request: NextRequest) {
  const forbidden = enforcePermission(request, 'contracts.write');
  if (forbidden) return forbidden;

  const body = (await request.json()) as {
    contractId?: string;
    label?: string;
    dueDate?: string;
    amount?: number;
    paidAmount?: number;
    status?: PaymentItemStatus;
  };

  if (!body.contractId || !body.dueDate || body.amount === undefined || !body.status) {
    return NextResponse.json({ error: 'contractId, dueDate, amount, status are required' }, { status: 400 });
  }

  const created = await createPaymentItem({
    contractId: body.contractId,
    label: body.label,
    dueDate: body.dueDate,
    amount: Number(body.amount),
    paidAmount: body.paidAmount === undefined ? 0 : Number(body.paidAmount),
    status: body.status
  });
  const currentUser = await getCurrentUser();

  await writeAuditLog({
    entityType: 'payment_item',
    entityId: created.id,
    action: 'create',
    actor: currentUser?.email ?? resolveRole(request),
    newValue: created
  });

  return NextResponse.json({ data: created }, { status: 201 });
}
