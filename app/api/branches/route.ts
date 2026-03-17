import { NextRequest, NextResponse } from 'next/server';
import { createBranch, readBranches } from '@/lib/finance-store';
import { enforcePermission, resolveRole } from '@/lib/authz';
import { writeAuditLog } from '@/lib/audit-store';

export async function GET() {
  const branches = await readBranches();
  return NextResponse.json({ data: branches });
}

export async function POST(request: NextRequest) {
  const forbidden = enforcePermission(request, 'students.write');
  if (forbidden) return forbidden;

  const body = (await request.json()) as { name?: string };
  if (!body.name?.trim()) {
    return NextResponse.json({ error: 'name is required' }, { status: 400 });
  }

  const created = await createBranch({ name: body.name });
  await writeAuditLog({
    entityType: 'branch',
    entityId: created.id,
    action: 'create',
    actor: resolveRole(request),
    newValue: created
  });

  return NextResponse.json({ data: created }, { status: 201 });
}
