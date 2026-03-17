import {
  Branch,
  CollectionTask,
  Contract,
  Enrollment,
  PaymentItem,
  Student,
  WithdrawalCase
} from '@/lib/domain';

export const branches: Branch[] = [
  { id: 'b1', name: 'Филиал Центр' },
  { id: 'b2', name: 'Филиал Восток' }
];

export const students: Student[] = [
  { id: 's1', fullName: 'Ахметов Султан', phone: '+7 777 555 55 55', createdAt: '2024-09-01' },
  { id: 's2', fullName: 'Эсеналиева Элина', phone: '+7 701 723 71 71', createdAt: '2025-12-03' },
  { id: 's3', fullName: 'Нурланова Аделина', phone: '+7 700 130 03 11', createdAt: '2023-09-01' }
];

export const enrollments: Enrollment[] = [
  { id: 'e1', studentId: 's1', branchId: 'b1', academicYear: '2025-2026', grade: '10', status: 'active' },
  { id: 'e2', studentId: 's2', branchId: 'b1', academicYear: '2025-2026', grade: '8', status: 'active' },
  { id: 'e3', studentId: 's3', branchId: 'b2', academicYear: '2025-2026', grade: '7', status: 'withdrawal_requested' }
];

export const contracts: Contract[] = [
  {
    id: 'c1',
    enrollmentId: 'e1',
    basePrice: 405000,
    discountAmount: 15000,
    prepaymentAmount: 40000,
    startedAt: '2025-09-01',
    paymentMode: 'monthly'
  },
  {
    id: 'c2',
    enrollmentId: 'e2',
    basePrice: 360000,
    discountAmount: 0,
    prepaymentAmount: 60000,
    startedAt: '2025-12-01',
    paymentMode: 'monthly'
  },
  {
    id: 'c3',
    enrollmentId: 'e3',
    basePrice: 450000,
    discountAmount: 45000,
    prepaymentAmount: 45000,
    startedAt: '2025-09-01',
    paymentMode: 'one_time'
  }
];

export const paymentItems: PaymentItem[] = [
  { id: 'p1', contractId: 'c1', dueDate: '2026-01-10', amount: 45000, paidAmount: 45000, status: 'paid' },
  { id: 'p2', contractId: 'c1', dueDate: '2026-02-10', amount: 45000, paidAmount: 30000, status: 'partially_paid' },
  { id: 'p3', contractId: 'c1', dueDate: '2026-03-10', amount: 45000, paidAmount: 0, status: 'planned' },
  { id: 'p4', contractId: 'c2', dueDate: '2026-01-05', amount: 50000, paidAmount: 0, status: 'overdue' },
  { id: 'p5', contractId: 'c2', dueDate: '2026-02-05', amount: 50000, paidAmount: 0, status: 'planned' },
  { id: 'p6', contractId: 'c3', dueDate: '2025-09-15', amount: 405000, paidAmount: 300000, status: 'overdue' }
];

export const collectionTasks: CollectionTask[] = [
  {
    id: 't1',
    studentId: 's2',
    paymentItemId: 'p4',
    status: 'promise_to_pay',
    note: 'Обещал оплатить до пятницы',
    updatedAt: '2026-02-25'
  },
  {
    id: 't2',
    studentId: 's3',
    paymentItemId: 'p6',
    status: 'contacted',
    note: 'Нужен перерасчет из-за выбытия',
    updatedAt: '2026-02-24'
  }
];

export const withdrawalCases: WithdrawalCase[] = [
  {
    id: 'w1',
    enrollmentId: 'e3',
    reason: 'Переезд семьи',
    effectiveDate: '2026-02-20',
    settlementAmount: 105000,
    settlementType: 'debt',
    approvedBy: 'Фин. менеджер'
  }
];

export function getBranchName(branchId: string) {
  return branches.find((b) => b.id === branchId)?.name ?? '—';
}

export function getStudentById(studentId: string) {
  return students.find((s) => s.id === studentId);
}

export function getEnrollmentByStudentId(studentId: string) {
  return enrollments.find((e) => e.studentId === studentId);
}

export function getContractByEnrollmentId(enrollmentId: string) {
  return contracts.find((c) => c.enrollmentId === enrollmentId);
}

export function getPaymentsByContractId(contractId: string) {
  return paymentItems.filter((p) => p.contractId === contractId);
}

export function getTotals() {
  const totalStudents = students.length;
  const overdueItems = paymentItems.filter((p) => p.status === 'overdue');
  const overdueAmount = overdueItems.reduce((acc, item) => acc + (item.amount - item.paidAmount), 0);
  const dueThisWeek = paymentItems.filter((p) => p.status === 'planned' || p.status === 'partially_paid').length;
  const withdrawalCount = enrollments.filter((e) => e.status === 'withdrawn' || e.status === 'withdrawal_requested').length;

  return { totalStudents, overdueAmount, dueThisWeek, withdrawalCount };
}
