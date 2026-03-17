import { CollectionStatus, EnrollmentStatus, PaymentItemStatus } from '@/lib/domain';
import { supabaseServer } from '@/lib/supabase-server';
import { db } from '@/lib/db';
import { paymentItems, contracts, enrollments, students, branches, paymentTransactions } from '@/lib/db/schema';
import { eq, and, desc, sql, gte, lte, sum } from 'drizzle-orm';

type EnrollmentRow = {
  id: string;
  student_id: string;
  branch_id: string;
  academic_year: string;
  grade: string;
  status: EnrollmentStatus;
};

type ContractRow = {
  id: string;
  enrollment_id: string;
  base_price: number;
  discount_amount: number;
  prepayment_amount: number;
  payment_mode: 'one_time' | 'monthly';
  started_at: string;
};

type PaymentItemRow = {
  id: string;
  contract_id: string;
  label: string | null;
  due_date: string;
  amount: number;
  paid_amount: number;
  status: PaymentItemStatus;
};

type CollectionTaskRow = {
  id: string;
  student_id: string;
  payment_item_id: string;
  status: CollectionStatus;
  note: string;
  updated_at: string;
};

type WithdrawalRow = {
  id: string;
  enrollment_id: string;
  reason: string;
  effective_date: string;
  settlement_type: 'refund' | 'debt' | 'zero';
  settlement_amount: number;
  approved_by: string | null;
};

export type StudentFinanceSnapshot = {
  enrollment: {
    id: string;
    branchId: string;
    branchName: string | null;
    academicYear: string;
    grade: string;
    status: EnrollmentStatus;
  } | null;
  contract: {
    id: string;
    basePrice: number;
    discountAmount: number;
    prepaymentAmount: number;
    paymentMode: 'one_time' | 'monthly';
    startedAt: string;
  } | null;
  payments: Array<{
    id: string;
    label: string | null;
    dueDate: string;
    amount: number;
    paidAmount: number;
    status: PaymentItemStatus;
  }>;
  collectionTask: {
    id: string;
    paymentItemId: string;
    status: CollectionStatus;
    note: string;
    updatedAt: string;
  } | null;
  withdrawalCase: {
    id: string;
    reason: string;
    effectiveDate: string;
    settlementType: 'refund' | 'debt' | 'zero';
    settlementAmount: number;
    approvedBy: string | null;
  } | null;
};

export type DashboardSnapshot = {
  summary: {
    totalStudents: number;
    overdueAmount: number;
    dueThisWeek: number;
    withdrawalCount: number;
  };
  queue: Array<{
    taskId: string;
    studentId: string;
    studentName: string;
    branchName: string;
    status: CollectionStatus;
    note: string;
    updatedAt: string;
  }>;
};

export async function getDashboardSnapshot(): Promise<DashboardSnapshot> {
  const [{ count: studentsCount, error: studentsCountError }, { data: overdueRows, error: overdueError }, { data: dueRows, error: dueError }, { count: withdrawalCount, error: withdrawalCountError }, { data: tasks, error: tasksError }] =
    await Promise.all([
      supabaseServer.from('students').select('id', { count: 'exact', head: true }),
      supabaseServer.from('payment_items').select('amount, paid_amount').eq('status', 'overdue'),
      supabaseServer.from('payment_items').select('id').in('status', ['planned', 'partially_paid']).lte('due_date', new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString().slice(0, 10)),
      supabaseServer.from('enrollments').select('id', { count: 'exact', head: true }).in('status', ['withdrawal_requested', 'withdrawn']),
      supabaseServer.from('collection_tasks').select('id, student_id, status, note, updated_at').order('updated_at', { ascending: false }).limit(15)
    ]);

  if (studentsCountError) throw new Error(`Failed dashboard students count: ${studentsCountError.message}`);
  if (overdueError) throw new Error(`Failed dashboard overdue read: ${overdueError.message}`);
  if (dueError) throw new Error(`Failed dashboard due read: ${dueError.message}`);
  if (withdrawalCountError) throw new Error(`Failed dashboard withdrawal count: ${withdrawalCountError.message}`);
  if (tasksError) throw new Error(`Failed dashboard tasks read: ${tasksError.message}`);

  const overdueAmount = (overdueRows ?? []).reduce((acc, item) => acc + (Number(item.amount) - Number(item.paid_amount)), 0);
  const dueThisWeek = dueRows?.length ?? 0;

  const taskRows = (tasks ?? []) as Array<{
    id: string;
    student_id: string;
    status: CollectionStatus;
    note: string;
    updated_at: string;
  }>;

  const studentIds = [...new Set(taskRows.map((row) => row.student_id))];

  const [{ data: studentRows, error: studentRowsError }, { data: enrollmentRows, error: enrollmentRowsError }] = await Promise.all([
    studentIds.length > 0
      ? supabaseServer.from('students').select('id, full_name').in('id', studentIds)
      : Promise.resolve({ data: [], error: null }),
    studentIds.length > 0
      ? supabaseServer.from('enrollments').select('student_id, branch_id, created_at').in('student_id', studentIds).order('created_at', { ascending: false })
      : Promise.resolve({ data: [], error: null })
  ]);

  if (studentRowsError) throw new Error(`Failed dashboard student rows read: ${studentRowsError.message}`);
  if (enrollmentRowsError) throw new Error(`Failed dashboard enrollment rows read: ${enrollmentRowsError.message}`);

  const branchIds = [...new Set((enrollmentRows ?? []).map((row) => row.branch_id as string))];
  const { data: branchRows, error: branchRowsError } =
    branchIds.length > 0
      ? await supabaseServer.from('branches').select('id, name').in('id', branchIds)
      : { data: [], error: null };

  if (branchRowsError) throw new Error(`Failed dashboard branch rows read: ${branchRowsError.message}`);

  const studentNameById = new Map((studentRows ?? []).map((row) => [row.id as string, row.full_name as string]));
  const latestEnrollmentByStudentId = new Map<string, string>();

  for (const row of enrollmentRows ?? []) {
    const studentId = row.student_id as string;
    if (!latestEnrollmentByStudentId.has(studentId)) {
      latestEnrollmentByStudentId.set(studentId, row.branch_id as string);
    }
  }

  const branchNameById = new Map((branchRows ?? []).map((row) => [row.id as string, row.name as string]));

  return {
    summary: {
      totalStudents: studentsCount ?? 0,
      overdueAmount,
      dueThisWeek,
      withdrawalCount: withdrawalCount ?? 0
    },
    queue: taskRows.map((row) => ({
      taskId: row.id,
      studentId: row.student_id,
      studentName: studentNameById.get(row.student_id) ?? row.student_id,
      branchName: branchNameById.get(latestEnrollmentByStudentId.get(row.student_id) ?? '') ?? '—',
      status: row.status,
      note: row.note,
      updatedAt: row.updated_at
    }))
  };
}

export async function getStudentFinanceSnapshot(studentId: string): Promise<StudentFinanceSnapshot> {
  const { data: enrollmentData, error: enrollmentError } = await supabaseServer
    .from('enrollments')
    .select('id, student_id, branch_id, academic_year, grade, status')
    .eq('student_id', studentId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (enrollmentError) {
    throw new Error(`Failed to read enrollment: ${enrollmentError.message}`);
  }

  const enrollment = (enrollmentData as EnrollmentRow | null) ?? null;

  if (!enrollment) {
    return { enrollment: null, contract: null, payments: [], collectionTask: null, withdrawalCase: null };
  }

  const { data: branchData, error: branchError } = await supabaseServer.from('branches').select('name').eq('id', enrollment.branch_id).maybeSingle();

  if (branchError) {
    throw new Error(`Failed to read branch: ${branchError.message}`);
  }

  const { data: contractData, error: contractError } = await supabaseServer
    .from('contracts')
    .select('id, enrollment_id, base_price, discount_amount, prepayment_amount, payment_mode, started_at')
    .eq('enrollment_id', enrollment.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (contractError) {
    throw new Error(`Failed to read contract: ${contractError.message}`);
  }

  const contract = (contractData as ContractRow | null) ?? null;

  if (!contract) {
    return {
      enrollment: {
        id: enrollment.id,
        branchId: enrollment.branch_id,
        branchName: (branchData as { name: string } | null)?.name ?? null,
        academicYear: enrollment.academic_year,
        grade: enrollment.grade,
        status: enrollment.status
      },
      contract: null,
      payments: [],
      collectionTask: null,
      withdrawalCase: null
    };
  }

  const [{ data: paymentData, error: paymentError }, { data: collectionData, error: collectionError }, { data: withdrawalData, error: withdrawalError }] =
    await Promise.all([
      supabaseServer
        .from('payment_items')
        .select('id, contract_id, label, due_date, amount, paid_amount, status')
        .eq('contract_id', contract.id)
        .order('due_date', { ascending: true }),
      supabaseServer
        .from('collection_tasks')
        .select('id, student_id, payment_item_id, status, note, updated_at')
        .eq('student_id', studentId)
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabaseServer
        .from('withdrawal_cases')
        .select('id, enrollment_id, reason, effective_date, settlement_type, settlement_amount, approved_by')
        .eq('enrollment_id', enrollment.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()
    ]);

  if (paymentError) throw new Error(`Failed to read payments: ${paymentError.message}`);
  if (collectionError) throw new Error(`Failed to read collection task: ${collectionError.message}`);
  if (withdrawalError) throw new Error(`Failed to read withdrawal case: ${withdrawalError.message}`);

  const payments = ((paymentData ?? []) as PaymentItemRow[]).map((row) => ({
    id: row.id,
    label: row.label,
    dueDate: row.due_date,
    amount: Number(row.amount),
    paidAmount: Number(row.paid_amount),
    status: row.status
  }));

  const collectionTask = collectionData
    ? {
      id: (collectionData as CollectionTaskRow).id,
      paymentItemId: (collectionData as CollectionTaskRow).payment_item_id,
      status: (collectionData as CollectionTaskRow).status,
      note: (collectionData as CollectionTaskRow).note,
      updatedAt: (collectionData as CollectionTaskRow).updated_at
    }
    : null;

  const withdrawalCase = withdrawalData
    ? {
      id: (withdrawalData as WithdrawalRow).id,
      reason: (withdrawalData as WithdrawalRow).reason,
      effectiveDate: (withdrawalData as WithdrawalRow).effective_date,
      settlementType: (withdrawalData as WithdrawalRow).settlement_type,
      settlementAmount: Number((withdrawalData as WithdrawalRow).settlement_amount),
      approvedBy: (withdrawalData as WithdrawalRow).approved_by
    }
    : null;

  return {
    enrollment: {
      id: enrollment.id,
      branchId: enrollment.branch_id,
      branchName: (branchData as { name: string } | null)?.name ?? null,
      academicYear: enrollment.academic_year,
      grade: enrollment.grade,
      status: enrollment.status
    },
    contract: {
      id: contract.id,
      basePrice: Number(contract.base_price),
      discountAmount: Number(contract.discount_amount),
      prepaymentAmount: Number(contract.prepayment_amount),
      paymentMode: contract.payment_mode,
      startedAt: contract.started_at
    },
    payments,
    collectionTask,
    withdrawalCase
  };
}

export async function createEnrollment(input: {
  studentId: string;
  branchId: string;
  academicYear: string;
  grade: string;
  status: EnrollmentStatus;
}) {
  const id = crypto.randomUUID();
  const { data, error } = await supabaseServer
    .from('enrollments')
    .insert({
      id,
      student_id: input.studentId,
      branch_id: input.branchId,
      academic_year: input.academicYear,
      grade: input.grade,
      status: input.status
    })
    .select('id, student_id, branch_id, academic_year, grade, status')
    .single();

  if (error) throw new Error(`Failed to create enrollment: ${error.message}`);
  return data;
}

export async function createContract(input: {
  enrollmentId: string;
  basePrice: number;
  discountAmount: number;
  prepaymentAmount: number;
  paymentMode: 'one_time' | 'monthly';
  startedAt: string;
}) {
  const id = crypto.randomUUID();
  const { data, error } = await supabaseServer
    .from('contracts')
    .insert({
      id,
      enrollment_id: input.enrollmentId,
      base_price: input.basePrice,
      discount_amount: input.discountAmount,
      prepayment_amount: input.prepaymentAmount,
      payment_mode: input.paymentMode,
      started_at: input.startedAt
    })
    .select('id, enrollment_id, base_price, discount_amount, prepayment_amount, payment_mode, started_at')
    .single();

  if (error) throw new Error(`Failed to create contract: ${error.message}`);
  return data;
}

export async function createPaymentItem(input: {
  contractId: string;
  label?: string;
  dueDate: string;
  amount: number;
  paidAmount?: number;
  status: PaymentItemStatus;
}) {
  const id = crypto.randomUUID();
  const { data, error } = await supabaseServer
    .from('payment_items')
    .insert({
      id,
      contract_id: input.contractId,
      label: input.label ?? null,
      due_date: input.dueDate,
      amount: input.amount,
      paid_amount: input.paidAmount ?? 0,
      status: input.status
    })
    .select('id, contract_id, label, due_date, amount, paid_amount, status')
    .single();

  if (error) throw new Error(`Failed to create payment item: ${error.message}`);
  return data;
}

export async function upsertCollectionTask(input: {
  studentId: string;
  paymentItemId: string;
  status: CollectionStatus;
  note: string;
}) {
  const existing = await supabaseServer
    .from('collection_tasks')
    .select('id, student_id, payment_item_id, status, note, updated_at')
    .eq('student_id', input.studentId)
    .eq('payment_item_id', input.paymentItemId)
    .maybeSingle();

  if (existing.error) {
    throw new Error(`Failed to read collection task: ${existing.error.message}`);
  }

  if (existing.data) {
    const { data, error } = await supabaseServer
      .from('collection_tasks')
      .update({
        status: input.status,
        note: input.note,
        updated_at: new Date().toISOString()
      })
      .eq('id', (existing.data as CollectionTaskRow).id)
      .select('id, student_id, payment_item_id, status, note, updated_at')
      .single();

    if (error) throw new Error(`Failed to update collection task: ${error.message}`);
    return { before: existing.data, after: data };
  }

  const id = crypto.randomUUID();
  const { data, error } = await supabaseServer
    .from('collection_tasks')
    .insert({
      id,
      student_id: input.studentId,
      payment_item_id: input.paymentItemId,
      status: input.status,
      note: input.note
    })
    .select('id, student_id, payment_item_id, status, note, updated_at')
    .single();

  if (error) throw new Error(`Failed to create collection task: ${error.message}`);
  return { before: null, after: data };
}

export async function createWithdrawalCase(input: {
  enrollmentId: string;
  reason: string;
  effectiveDate: string;
  settlementType: 'refund' | 'debt' | 'zero';
  settlementAmount: number;
  approvedBy?: string;
}) {
  const id = crypto.randomUUID();
  const { data, error } = await supabaseServer
    .from('withdrawal_cases')
    .insert({
      id,
      enrollment_id: input.enrollmentId,
      reason: input.reason,
      effective_date: input.effectiveDate,
      settlement_type: input.settlementType,
      settlement_amount: input.settlementAmount,
      approved_by: input.approvedBy ?? null,
      approved_at: input.approvedBy ? new Date().toISOString() : null
    })
    .select('id, enrollment_id, reason, effective_date, settlement_type, settlement_amount, approved_by')
    .single();

  if (error) throw new Error(`Failed to create withdrawal case: ${error.message}`);

  const { error: enrollmentError } = await supabaseServer.from('enrollments').update({ status: 'withdrawal_requested' }).eq('id', input.enrollmentId);

  if (enrollmentError) {
    throw new Error(`Failed to update enrollment status: ${enrollmentError.message}`);
  }

  return data;
}

export async function getContractById(id: string) {
  const { data, error } = await supabaseServer
    .from('contracts')
    .select('id, enrollment_id, base_price, discount_amount, prepayment_amount, payment_mode, started_at')
    .eq('id', id)
    .maybeSingle();

  if (error) throw new Error(`Failed to read contract: ${error.message}`);
  return data;
}

export async function updateContract(
  id: string,
  input: Partial<{
    basePrice: number;
    discountAmount: number;
    prepaymentAmount: number;
    paymentMode: 'one_time' | 'monthly';
    startedAt: string;
  }>
) {
  const updates: Record<string, unknown> = {};
  if (input.basePrice !== undefined) updates.base_price = input.basePrice;
  if (input.discountAmount !== undefined) updates.discount_amount = input.discountAmount;
  if (input.prepaymentAmount !== undefined) updates.prepayment_amount = input.prepaymentAmount;
  if (input.paymentMode !== undefined) updates.payment_mode = input.paymentMode;
  if (input.startedAt !== undefined) updates.started_at = input.startedAt;

  const { data, error } = await supabaseServer
    .from('contracts')
    .update(updates)
    .eq('id', id)
    .select('id, enrollment_id, base_price, discount_amount, prepayment_amount, payment_mode, started_at')
    .maybeSingle();

  if (error) throw new Error(`Failed to update contract: ${error.message}`);
  return data;
}

export async function deleteContract(id: string) {
  const { error } = await supabaseServer.from('contracts').delete().eq('id', id);
  if (error) throw new Error(`Failed to delete contract: ${error.message}`);
}

export async function getPaymentItemById(id: string) {
  const { data, error } = await supabaseServer
    .from('payment_items')
    .select('id, contract_id, label, due_date, amount, paid_amount, status')
    .eq('id', id)
    .maybeSingle();

  if (error) throw new Error(`Failed to read payment item: ${error.message}`);
  return data;
}

export async function updatePaymentItem(
  id: string,
  input: Partial<{
    label: string;
    dueDate: string;
    amount: number;
    paidAmount: number;
    status: PaymentItemStatus;
  }>
) {
  const updates: Record<string, unknown> = {};
  if (input.label !== undefined) updates.label = input.label;
  if (input.dueDate !== undefined) updates.due_date = input.dueDate;
  if (input.amount !== undefined) updates.amount = input.amount;
  if (input.paidAmount !== undefined) updates.paid_amount = input.paidAmount;
  if (input.status !== undefined) updates.status = input.status;

  const { data, error } = await supabaseServer
    .from('payment_items')
    .update(updates)
    .eq('id', id)
    .select('id, contract_id, label, due_date, amount, paid_amount, status')
    .maybeSingle();

  if (error) throw new Error(`Failed to update payment item: ${error.message}`);
  return data;
}

export async function deletePaymentItem(id: string) {
  const { error } = await supabaseServer.from('payment_items').delete().eq('id', id);
  if (error) throw new Error(`Failed to delete payment item: ${error.message}`);
}

export async function getWithdrawalCaseById(id: string) {
  const { data, error } = await supabaseServer
    .from('withdrawal_cases')
    .select('id, enrollment_id, reason, effective_date, settlement_type, settlement_amount, approved_by')
    .eq('id', id)
    .maybeSingle();

  if (error) throw new Error(`Failed to read withdrawal case: ${error.message}`);
  return data;
}

export async function updateWithdrawalCase(
  id: string,
  input: Partial<{
    reason: string;
    effectiveDate: string;
    settlementType: 'refund' | 'debt' | 'zero';
    settlementAmount: number;
    approvedBy: string;
  }>
) {
  const updates: Record<string, unknown> = {};
  if (input.reason !== undefined) updates.reason = input.reason;
  if (input.effectiveDate !== undefined) updates.effective_date = input.effectiveDate;
  if (input.settlementType !== undefined) updates.settlement_type = input.settlementType;
  if (input.settlementAmount !== undefined) updates.settlement_amount = input.settlementAmount;
  if (input.approvedBy !== undefined) {
    updates.approved_by = input.approvedBy;
    updates.approved_at = new Date().toISOString();
  }

  const { data, error } = await supabaseServer
    .from('withdrawal_cases')
    .update(updates)
    .eq('id', id)
    .select('id, enrollment_id, reason, effective_date, settlement_type, settlement_amount, approved_by')
    .maybeSingle();

  if (error) throw new Error(`Failed to update withdrawal case: ${error.message}`);
  return data;
}

export async function deleteWithdrawalCase(id: string) {
  const { error } = await supabaseServer.from('withdrawal_cases').delete().eq('id', id);
  if (error) throw new Error(`Failed to delete withdrawal case: ${error.message}`);
}

type BranchRow = { id: string; name: string };

type CollectionPerformanceRow = {
  status: CollectionStatus;
  count: number;
};

export async function readBranches() {
  const { data, error } = await supabaseServer.from('branches').select('id, name').order('name', { ascending: true });
  if (error) throw new Error(`Failed to read branches: ${error.message}`);

  return ((data ?? []) as BranchRow[]).map((row) => ({ id: row.id, name: row.name }));
}

export async function createBranch(input: { name: string }) {
  const id = crypto.randomUUID();
  const { data, error } = await supabaseServer.from('branches').insert({ id, name: input.name.trim() }).select('id, name').single();
  if (error) throw new Error(`Failed to create branch: ${error.message}`);
  return data as BranchRow;
}

export async function getReportsOverview() {
  const today = new Date();
  const todayStr = today.toISOString().slice(0, 10);
  const in30 = new Date(today.getTime() + 30 * 24 * 3600 * 1000).toISOString().slice(0, 10);

  const [{ data: paymentRows, error: paymentError }, { data: collectionRows, error: collectionError }] = await Promise.all([
    supabaseServer.from('payment_items').select('id, due_date, amount, paid_amount, status'),
    supabaseServer.from('collection_tasks').select('status')
  ]);

  if (paymentError) throw new Error(`Failed reports payment read: ${paymentError.message}`);
  if (collectionError) throw new Error(`Failed reports collection read: ${collectionError.message}`);

  const rows = (paymentRows ?? []) as Array<{ due_date: string; amount: number; paid_amount: number; status: PaymentItemStatus }>;

  const aging = { bucket_0_7: 0, bucket_8_30: 0, bucket_31_plus: 0 };

  for (const row of rows) {
    const remaining = Number(row.amount) - Number(row.paid_amount);
    if (remaining <= 0) continue;

    if (row.status === 'overdue') {
      const due = new Date(row.due_date);
      const days = Math.max(0, Math.floor((today.getTime() - due.getTime()) / (24 * 3600 * 1000)));
      if (days <= 7) aging.bucket_0_7 += remaining;
      else if (days <= 30) aging.bucket_8_30 += remaining;
      else aging.bucket_31_plus += remaining;
    }
  }

  const plannedPeriod = rows
    .filter((row) => row.due_date >= todayStr && row.due_date <= in30)
    .reduce((acc, row) => acc + Number(row.amount), 0);

  const actualPeriod = rows
    .filter((row) => row.due_date >= todayStr && row.due_date <= in30)
    .reduce((acc, row) => acc + Number(row.paid_amount), 0);

  const perfCounter = new Map<CollectionStatus, number>([
    ['no_contact', 0],
    ['contacted', 0],
    ['promise_to_pay', 0],
    ['refused', 0],
    ['closed', 0]
  ]);

  for (const row of (collectionRows ?? []) as CollectionPerformanceRow[]) {
    perfCounter.set(row.status, (perfCounter.get(row.status) ?? 0) + 1);
  }

  return {
    aging,
    planFact: {
      periodFrom: todayStr,
      periodTo: in30,
      plannedAmount: plannedPeriod,
      actualAmount: actualPeriod,
      gapAmount: plannedPeriod - actualPeriod
    },
    collectionPerformance: Object.fromEntries(perfCounter)
  };
}

export async function getReceiptsSummary(periodStart: string, periodEnd: string) {
  const result = await db
    .select({
      source: paymentTransactions.source,
      totalAmount: sum(paymentTransactions.amount).mapWith(Number)
    })
    .from(paymentTransactions)
    .where(
      and(
        gte(sql`DATE(${paymentTransactions.paidAt})`, periodStart),
        lte(sql`DATE(${paymentTransactions.paidAt})`, periodEnd),
        eq(paymentTransactions.isReversed, false)
      )
    )
    .groupBy(paymentTransactions.source);

  const summary: Record<string, number> = {
    kaspi: 0,
    cash: 0,
    bank_transfer: 0,
    manual: 0
  };

  for (const row of result) {
    if (row.source) {
      summary[row.source] = (summary[row.source] || 0) + (row.totalAmount || 0);
    }
  }

  return summary;
}

export type DebtorRow = {
  paymentItemId: string;
  studentId: string;
  studentName: string;
  phone: string | null;
  branchName: string | null;
  dueDate: string;
  amount: number;
  paidAmount: number;
  debtAmount: number;
  label: string | null;
  status: string;
};

export async function getAllDebtors(): Promise<DebtorRow[]> {
  const overdueItems = await db
    .select({
      paymentItemId: paymentItems.id,
      dueDate: paymentItems.dueDate,
      amount: paymentItems.amount,
      paidAmount: paymentItems.paidAmount,
      label: paymentItems.label,
      studentId: students.id,
      studentName: students.fullName,
      phone: students.phone,
      branchName: branches.name,
      status: paymentItems.status
    })
    .from(paymentItems)
    .innerJoin(contracts, eq(paymentItems.contractId, contracts.id))
    .innerJoin(enrollments, eq(contracts.enrollmentId, enrollments.id))
    .innerJoin(students, eq(enrollments.studentId, students.id))
    .leftJoin(branches, eq(enrollments.branchId, branches.id))
    .where(eq(paymentItems.status, 'overdue'))
    .orderBy(desc(paymentItems.dueDate));

  return overdueItems.map((item) => ({
    paymentItemId: item.paymentItemId,
    studentId: item.studentId,
    studentName: item.studentName,
    phone: item.phone,
    branchName: item.branchName,
    dueDate: item.dueDate,
    amount: Number(item.amount),
    paidAmount: Number(item.paidAmount),
    debtAmount: Number(item.amount) - Number(item.paidAmount),
    label: item.label,
    status: item.status
  }));
}

