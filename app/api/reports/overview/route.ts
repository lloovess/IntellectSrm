import { NextRequest, NextResponse } from 'next/server';
import { enforcePermission } from '@/lib/authz';
import { getReportsOverview } from '@/lib/finance-store';

export async function GET(request: NextRequest) {
  const forbidden = enforcePermission(request, 'reports.read');
  if (forbidden) return forbidden;

  const data = await getReportsOverview();
  return NextResponse.json({ data });
}
