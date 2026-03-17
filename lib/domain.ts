export type PaymentItemStatus = 'planned' | 'partially_paid' | 'paid' | 'overdue';
export type CollectionStatus = 'no_contact' | 'contacted' | 'promise_to_pay' | 'refused' | 'closed';
export type EnrollmentStatus = 'active' | 'withdrawal_requested' | 'withdrawn' | 're_enrolled';

export type Branch = {
  id: string;
  name: string;
};

export type Student = {
  id: string;
  fullName: string;
  phone: string;
  createdAt: string;
};

export type Enrollment = {
  id: string;
  studentId: string;
  branchId: string;
  academicYear: string;
  grade: string;
  status: EnrollmentStatus;
};

export type Contract = {
  id: string;
  enrollmentId: string;
  basePrice: number;
  discountAmount: number;
  prepaymentAmount: number;
  startedAt: string;
  paymentMode: 'one_time' | 'monthly';
};

export type PaymentItem = {
  id: string;
  contractId: string;
  dueDate: string;
  amount: number;
  paidAmount: number;
  status: PaymentItemStatus;
};

export type CollectionTask = {
  id: string;
  studentId: string;
  paymentItemId: string;
  status: CollectionStatus;
  note: string;
  updatedAt: string;
};

export type WithdrawalCase = {
  id: string;
  enrollmentId: string;
  reason: string;
  effectiveDate: string;
  settlementAmount: number;
  settlementType: 'refund' | 'debt' | 'zero';
  approvedBy: string;
};
