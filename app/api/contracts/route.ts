import { NextRequest, NextResponse } from 'next/server';
import { enforcePermission, resolveRole } from '@/lib/authz';
import { writeAuditLog } from '@/lib/audit-store';
import { createContract } from '@/lib/finance-store';
import { getCurrentUser } from '@/lib/auth/session';

export async function POST(request: NextRequest) {
  const forbidden = enforcePermission(request, 'contracts.write');
  if (forbidden) return forbidden;

  const body = (await request.json()) as {
    enrollmentId?: string;
    basePrice?: number;
    discountAmount?: number;
    prepaymentAmount?: number;
    paymentMode?: 'one_time' | 'monthly';
    startedAt?: string;
  };

  if (!body.enrollmentId || body.basePrice === undefined || body.discountAmount === undefined || body.prepaymentAmount === undefined || !body.paymentMode || !body.startedAt) {
    return NextResponse.json(
      { error: 'enrollmentId, basePrice, discountAmount, prepaymentAmount, paymentMode, startedAt are required' },
      { status: 400 }
    );
  }

  const created = await createContract({
    enrollmentId: body.enrollmentId,
    basePrice: Number(body.basePrice),
    discountAmount: Number(body.discountAmount),
    prepaymentAmount: Number(body.prepaymentAmount),
    paymentMode: body.paymentMode,
    startedAt: body.startedAt
  });
  const currentUser = await getCurrentUser();

  await writeAuditLog({
    entityType: 'contract',
    entityId: created.id,
    action: 'create',
    actor: currentUser?.email ?? resolveRole(request),
    newValue: created
  });

  return NextResponse.json({ data: created }, { status: 201 });
}
