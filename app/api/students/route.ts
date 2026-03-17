import { NextRequest, NextResponse } from 'next/server';
import { createStudent, readStudents } from '@/lib/student-store';
import { enforcePermission, resolveRole } from '@/lib/authz';
import { writeAuditLog } from '@/lib/audit-store';

export async function GET() {
  try {
    const students = await readStudents();
    return NextResponse.json({ data: students });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const forbidden = enforcePermission(request, 'students.write');
  if (forbidden) return forbidden;

  const body = (await request.json()) as { fullName?: string; phone?: string };

  if (!body.fullName?.trim() || !body.phone?.trim()) {
    return NextResponse.json({ error: 'fullName and phone are required' }, { status: 400 });
  }

  try {
    const created = await createStudent({ fullName: body.fullName, phone: body.phone });
    await writeAuditLog({
      entityType: 'student',
      entityId: created.id,
      action: 'create',
      actor: resolveRole(request),
      newValue: created
    });

    return NextResponse.json({ data: created }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
