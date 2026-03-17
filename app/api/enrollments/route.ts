import { NextRequest, NextResponse } from 'next/server';
import { enforcePermission, resolveRole } from '@/lib/authz';
import { writeAuditLog } from '@/lib/audit-store';
import { createEnrollment } from '@/lib/finance-store';
import { EnrollmentStatus } from '@/lib/domain';

export async function POST(request: NextRequest) {
  const forbidden = enforcePermission(request, 'contracts.write');
  if (forbidden) return forbidden;

  const body = (await request.json()) as {
    studentId?: string;
    branchId?: string;
    academicYear?: string;
    grade?: string;
    status?: EnrollmentStatus;
  };

  if (!body.studentId || !body.branchId || !body.academicYear || !body.grade || !body.status) {
    return NextResponse.json({ error: 'studentId, branchId, academicYear, grade, status are required' }, { status: 400 });
  }

  const created = await createEnrollment({
    studentId: body.studentId,
    branchId: body.branchId,
    academicYear: body.academicYear,
    grade: body.grade,
    status: body.status
  });

  await writeAuditLog({
    entityType: 'enrollment',
    entityId: created.id,
    action: 'create',
    actor: resolveRole(request),
    newValue: created
  });

  return NextResponse.json({ data: created }, { status: 201 });
}
