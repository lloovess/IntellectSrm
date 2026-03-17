import { NextRequest, NextResponse } from 'next/server';
import { PermissionKey, Role, rbacMatrix } from '@/lib/rbac';
import { isRole, ROLE_COOKIE_NAME } from '@/lib/user-role';

export function resolveRole(request: NextRequest): Role {
  if (process.env.NODE_ENV === 'test' || process.env.E2E_BYPASS_AUTH === '1') {
    const headerRole = request.headers.get('x-role')?.trim();
    if (headerRole && isRole(headerRole)) {
      return headerRole;
    }
  }

  const cookieRole = request.cookies.get(ROLE_COOKIE_NAME)?.value?.trim();
  if (cookieRole && isRole(cookieRole)) {
    return cookieRole;
  }

  return 'assistant';
}

export function enforcePermission(request: NextRequest, permission: PermissionKey): NextResponse | null {
  const role = resolveRole(request);
  if (rbacMatrix[role].includes(permission)) {
    return null;
  }

  return NextResponse.json(
    {
      error: 'Forbidden',
      requiredPermission: permission,
      role
    },
    { status: 403 }
  );
}
