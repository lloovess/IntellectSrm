import { NextRequest, NextResponse } from 'next/server';
import { getStudentById, updateStudent } from '@/lib/student-store';
import { enforcePermission, resolveRole } from '@/lib/authz';
import { writeAuditLog } from '@/lib/audit-store';

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const student = await getStudentById(id);

  if (!student) {
    return NextResponse.json({ error: 'Student not found' }, { status: 404 });
  }

  return NextResponse.json({ data: student });
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const forbidden = enforcePermission(request, 'students.write');
  if (forbidden) return forbidden;

  const { id } = await params;
  const body = (await request.json()) as { fullName?: string; phone?: string };
  const before = await getStudentById(id);

  const updated = await updateStudent(id, body);

  if (!updated) {
    return NextResponse.json({ error: 'Student not found' }, { status: 404 });
  }

  await writeAuditLog({
    entityType: 'student',
    entityId: updated.id,
    action: 'update',
    actor: resolveRole(request),
    oldValue: before,
    newValue: updated
  });

  return NextResponse.json({ data: updated });
}
