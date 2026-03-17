alter table payment_transactions
  add column if not exists payer_name text,
  add column if not exists payer_phone text,
  add column if not exists allocation_group_id uuid,
  add column if not exists kind text not null default 'payment',
  add column if not exists related_transaction_id uuid;

create table if not exists student_credit_ledger (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references students(id) on delete cascade,
  contract_id uuid references contracts(id) on delete set null,
  payment_transaction_id uuid references payment_transactions(id) on delete set null,
  direction text not null check (direction in ('credit', 'debit')),
  amount numeric(12, 2) not null check (amount >= 0),
  reason text not null,
  created_by text not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_payment_transactions_allocation_group_id
  on payment_transactions (allocation_group_id);

create index if not exists idx_student_credit_ledger_student_id_created_at
  on student_credit_ledger (student_id, created_at desc);
