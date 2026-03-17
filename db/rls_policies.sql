-- Supabase RLS baseline for School CRM
-- Run after db/schema.sql

-- 1) Enable RLS
alter table students enable row level security;
alter table branches enable row level security;
alter table enrollments enable row level security;
alter table contracts enable row level security;
alter table payment_items enable row level security;
alter table payment_transactions enable row level security;
alter table collection_tasks enable row level security;
alter table withdrawal_cases enable row level security;
alter table audit_logs enable row level security;
alter table classes enable row level security;
alter table guardians enable row level security;
alter table student_interactions enable row level security;

-- 2) Helpers: custom claim app_role from JWT
create or replace function public.current_app_role()
returns text
language sql
stable
as $$
  select coalesce(auth.jwt() ->> 'app_role', 'anonymous')
$$;

-- 3) Read policies
create policy students_read on students for select using (auth.role() = 'authenticated');
create policy branches_read on branches for select using (auth.role() = 'authenticated');
create policy enrollments_read on enrollments for select using (auth.role() = 'authenticated');
create policy contracts_read on contracts for select using (auth.role() = 'authenticated');
create policy payment_items_read on payment_items for select using (auth.role() = 'authenticated');
create policy payment_transactions_read on payment_transactions for select using (auth.role() = 'authenticated');
create policy collection_tasks_read on collection_tasks for select using (auth.role() = 'authenticated');
create policy withdrawal_cases_read on withdrawal_cases for select using (auth.role() = 'authenticated');
create policy audit_logs_read on audit_logs for select using (public.current_app_role() in ('accountant', 'finance_manager', 'admin'));
create policy classes_read on classes for select using (auth.role() = 'authenticated');
create policy guardians_read on guardians for select using (auth.role() = 'authenticated');
create policy student_interactions_read on student_interactions for select using (auth.role() = 'authenticated');

-- 4) Mutation policies by app_role
create policy students_write on students
for all
using (public.current_app_role() in ('assistant', 'admin'))
with check (public.current_app_role() in ('assistant', 'admin'));

create policy enrollments_write on enrollments
for all
using (public.current_app_role() in ('assistant', 'admin'))
with check (public.current_app_role() in ('assistant', 'admin'));

create policy contracts_write on contracts
for all
using (public.current_app_role() in ('assistant', 'admin'))
with check (public.current_app_role() in ('assistant', 'admin'));

create policy payment_items_write on payment_items
for all
using (public.current_app_role() in ('accountant', 'admin'))
with check (public.current_app_role() in ('accountant', 'admin'));

create policy payment_transactions_write on payment_transactions
for all
using (public.current_app_role() in ('accountant', 'admin'))
with check (public.current_app_role() in ('accountant', 'admin'));

create policy collections_write on collection_tasks
for all
using (public.current_app_role() in ('call_center', 'admin'))
with check (public.current_app_role() in ('call_center', 'admin'));

create policy withdrawals_write on withdrawal_cases
for all
using (public.current_app_role() in ('accountant', 'finance_manager', 'admin'))
with check (public.current_app_role() in ('accountant', 'finance_manager', 'admin'));

create policy audit_logs_write on audit_logs
for insert
with check (public.current_app_role() in ('assistant', 'call_center', 'accountant', 'finance_manager', 'admin'));

create policy classes_write on classes
for all
using (public.current_app_role() in ('assistant', 'admin'))
with check (public.current_app_role() in ('assistant', 'admin'));

create policy guardians_write on guardians
for all
using (public.current_app_role() in ('assistant', 'admin'))
with check (public.current_app_role() in ('assistant', 'admin'));

create policy student_interactions_write on student_interactions
for all
using (public.current_app_role() in ('assistant', 'admin'))
with check (public.current_app_role() in ('assistant', 'admin'));
