import { NextRequest, NextResponse } from 'next/server';
import { getStudentById } from '@/lib/student-store';
import { getStudentFinanceSnapshot } from '@/lib/finance-store';

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const student = await getStudentById(id);

  if (!student) {
    return NextResponse.json({ error: 'Student not found' }, { status: 404 });
  }

  const finance = await getStudentFinanceSnapshot(id);

  return NextResponse.json({ data: { student, ...finance } });
}
