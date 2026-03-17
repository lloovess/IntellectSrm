import { NextRequest, NextResponse } from 'next/server';
import { enforcePermission, resolveRole } from '@/lib/authz';
import { writeAuditLog } from '@/lib/audit-store';
import { createWithdrawalCase } from '@/lib/finance-store';

export async function POST(request: NextRequest) {
  const forbidden = enforcePermission(request, 'withdrawals.write');
  if (forbidden) return forbidden;

  const body = (await request.json()) as {
    enrollmentId?: string;
    reason?: string;
    effectiveDate?: string;
    settlementType?: 'refund' | 'debt' | 'zero';
    settlementAmount?: number;
  };

  if (!body.enrollmentId || !body.reason || !body.effectiveDate || !body.settlementType || body.settlementAmount === undefined) {
    return NextResponse.json(
      { error: 'enrollmentId, reason, effectiveDate, settlementType, settlementAmount are required' },
      { status: 400 }
    );
  }

  const created = await createWithdrawalCase({
    enrollmentId: body.enrollmentId,
    reason: body.reason,
    effectiveDate: body.effectiveDate,
    settlementType: body.settlementType,
    settlementAmount: Number(body.settlementAmount),
    approvedBy: resolveRole(request)
  });

  await writeAuditLog({
    entityType: 'withdrawal_case',
    entityId: created.id,
    action: 'create',
    actor: resolveRole(request),
    newValue: created
  });

  return NextResponse.json({ data: created }, { status: 201 });
}
