import { NextRequest, NextResponse } from 'next/server';
import { enforcePermission, resolveRole } from '@/lib/authz';
import { roleLabels, Role } from '@/lib/rbac';
import { supabaseServer } from '@/lib/supabase-server';
import { writeAuditLog } from '@/lib/audit-store';
import { isRole } from '@/lib/user-role';

type UserRoleRow = { user_id: string; role: Role };

function normalizeRole(value: string | undefined): Role | null {
  if (!value) return null;
  const raw = value.trim();
  return isRole(raw) ? raw : null;
}

export async function GET(request: NextRequest) {
  const forbidden = enforcePermission(request, 'rbac.manage');
  if (forbidden) return forbidden;

  const { data, error } = await supabaseServer.auth.admin.listUsers();
  if (error) {
    return NextResponse.json({ error: `Failed to list users: ${error.message}` }, { status: 500 });
  }

  const users = data.users ?? [];
  const ids = users.map((user) => user.id);

  const { data: rolesData, error: rolesError } =
    ids.length === 0
      ? { data: [] as UserRoleRow[], error: null }
      : await supabaseServer.from('user_roles').select('user_id, role').in('user_id', ids);

  if (rolesError) {
    return NextResponse.json({ error: `Failed to list user roles: ${rolesError.message}` }, { status: 500 });
  }

  const roleByUserId = new Map((rolesData ?? []).map((row) => [row.user_id, row.role as Role]));
  const result = users.map((user) => {
    const role = roleByUserId.get(user.id) ?? 'assistant';
    return {
      id: user.id,
      email: user.email ?? '',
      createdAt: user.created_at,
      lastSignInAt: user.last_sign_in_at,
      role,
      roleLabel: roleLabels[role]
    };
  });

  return NextResponse.json({ data: result });
}

export async function POST(request: NextRequest) {
  const forbidden = enforcePermission(request, 'rbac.manage');
  if (forbidden) return forbidden;

  const body = (await request.json()) as { email?: string; password?: string; role?: string };
  const email = body.email?.trim().toLowerCase();
  const password = body.password ?? '';
  const role = normalizeRole(body.role) ?? 'assistant';

  if (!email || !password) {
    return NextResponse.json({ error: 'Email и пароль обязательны' }, { status: 400 });
  }

  const { data: createdData, error: createError } = await supabaseServer.auth.admin.createUser({
    email,
    password,
    email_confirm: true
  });

  if (createError || !createdData.user) {
    return NextResponse.json({ error: `Failed to create user: ${createError?.message ?? 'unknown error'}` }, { status: 500 });
  }

  const userId = createdData.user.id;
  const { error: roleError } = await supabaseServer.from('user_roles').upsert({ user_id: userId, role }, { onConflict: 'user_id' });
  if (roleError) {
    return NextResponse.json({ error: `User created, but role assignment failed: ${roleError.message}` }, { status: 500 });
  }

  await writeAuditLog({
    entityType: 'user',
    entityId: userId,
    action: 'create',
    actor: resolveRole(request),
    newValue: { email, role }
  });

  return NextResponse.json(
    {
      data: {
        id: userId,
        email,
        role,
        roleLabel: roleLabels[role]
      }
    },
    { status: 201 }
  );
}

export async function PATCH(request: NextRequest) {
  const forbidden = enforcePermission(request, 'rbac.manage');
  if (forbidden) return forbidden;

  const body = (await request.json()) as { userId?: string; role?: string };
  const userId = body.userId?.trim();
  const role = normalizeRole(body.role);

  if (!userId || !role) {
    return NextResponse.json({ error: 'userId и role обязательны' }, { status: 400 });
  }

  const { data: beforeRoleData, error: beforeError } = await supabaseServer.from('user_roles').select('role').eq('user_id', userId).maybeSingle();
  if (beforeError) {
    return NextResponse.json({ error: `Failed to read current role: ${beforeError.message}` }, { status: 500 });
  }

  const { error: updateError } = await supabaseServer.from('user_roles').upsert({ user_id: userId, role }, { onConflict: 'user_id' });
  if (updateError) {
    return NextResponse.json({ error: `Failed to update role: ${updateError.message}` }, { status: 500 });
  }

  await writeAuditLog({
    entityType: 'user',
    entityId: userId,
    action: 'update',
    actor: resolveRole(request),
    oldValue: { role: (beforeRoleData as { role?: string } | null)?.role ?? null },
    newValue: { role }
  });

  return NextResponse.json({
    data: {
      userId,
      role,
      roleLabel: roleLabels[role]
    }
  });
}
