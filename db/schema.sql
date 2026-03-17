-- School CRM production schema (PostgreSQL)
-- Synchronized with Supabase: 2026-02-28

create table branches (
  id uuid primary key,
  name text not null,
  created_at timestamptz not null default now()
);

create table students (
  id uuid primary key,
  full_name text not null,
  phone text,
  email text,
  iin text,
  date_of_birth date,
  gender text,
  address text,
  notes text,
  created_at timestamptz not null default now()
);

create table enrollments (
  id uuid primary key,
  student_id uuid not null references students(id),
  branch_id uuid not null references branches(id),
  class_id uuid, -- references classes(id) added later
  academic_year text,
  grade text,
  status text not null check (status in ('active', 'withdrawal_requested', 'withdrawn', 're_enrolled', 'completed')),
  created_at timestamptz not null default now()
);

create table contracts (
  id uuid primary key,
  enrollment_id uuid not null references enrollments(id),
  base_price numeric(12,2) not null,
  discount_amount numeric(12,2) not null default 0,
  prepayment_amount numeric(12,2) not null default 0,
  payment_mode text not null check (payment_mode in ('one_time', 'monthly')),
  started_at date not null,
  payment_due_day integer not null default 1 check (payment_due_day >= 1 and payment_due_day <= 31),
  contract_number text,
  status text not null default 'active' check (status in ('active', 'completed', 'cancelled', 'inactive')),
  previous_contract_id uuid references contracts(id),
  created_at timestamptz not null default now()
);

create table payment_items (
  id uuid primary key,
  contract_id uuid not null references contracts(id),
  due_date date not null,
  amount numeric(12,2) not null,
  paid_amount numeric(12,2) not null default 0,
  status text not null check (status in ('planned', 'partially_paid', 'paid', 'overdue')),
  label text,
  created_at timestamptz not null default now()
);

create table payment_transactions (
  id uuid primary key,
  payment_item_id uuid not null references payment_items(id),
  amount numeric(12,2) not null,
  paid_at timestamptz not null,
  source text not null default 'manual',
  created_by text not null,
  created_at timestamptz not null default now()
);

create table collection_tasks (
  id uuid primary key,
  student_id uuid not null references students(id),
  payment_item_id uuid not null references payment_items(id),
  status text not null check (status in ('no_contact', 'contacted', 'promise_to_pay', 'refused', 'closed')),
  note text not null,
  updated_at timestamptz not null default now()
);

create table withdrawal_cases (
  id uuid primary key,
  enrollment_id uuid not null references enrollments(id),
  reason text not null,
  effective_date date not null,
  settlement_type text not null check (settlement_type in ('refund', 'debt', 'zero')),
  settlement_amount numeric(12,2) not null default 0,
  approved_by text,
  approved_at timestamptz,
  created_at timestamptz not null default now()
);

create table audit_logs (
  id uuid primary key,
  entity_type text not null,
  entity_id uuid not null,
  action text not null,
  old_value jsonb,
  new_value jsonb,
  actor text not null,
  created_at timestamptz not null default now()
);

create table user_roles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role text not null check (role in ('assistant', 'call_center', 'accountant', 'finance_manager', 'admin')),
  created_at timestamptz not null default now()
);

create table classes (
  id uuid primary key,
  branch_id uuid not null references branches(id) on delete cascade,
  name text not null,
  academic_year text not null,
  capacity integer not null default 20,
  status text not null default 'active' check (status in ('active', 'archived')),
  created_at timestamptz not null default now()
);
alter table enrollments add constraint fk_enrollments_classes foreign key (class_id) references classes(id);

create table guardians (
  id uuid primary key,
  student_id uuid not null references students(id) on delete cascade,
  full_name text not null,
  iin text,
  passport text,
  address text,
  phone text not null,
  email text,
  relationship text,
  created_at timestamptz not null default now()
);

create table student_interactions (
  id uuid primary key,
  student_id uuid not null references students(id) on delete cascade,
  type text not null,
  notes text not null,
  created_by text not null,
  created_at timestamptz not null default now()
);
