# SRM Intellect — Agent Context

> **Read this file first** before making any changes to the codebase.

## Project Overview

School CRM system (Intellect School, Kazakhstan). ~900 students, 3 branches, 5 RBAC roles.

## Architecture (STRICT — do NOT deviate)

```
page.tsx (thin Server Component — composition only)
    ↓ calls
Service Layer (lib/services/*.service.ts — business logic)
    ↓ calls
Repository Layer (lib/repositories/*.repo.ts — Drizzle ORM queries)
    ↓ reads/writes
Supabase PostgreSQL
```

### Rules
1. **page.tsx MUST be thin** — no SQL, no business logic, no direct Supabase calls
2. **All data access** through repositories (`lib/repositories/*.repo.ts`)
3. **All mutations** through Server Actions (`lib/actions/*.actions.ts`)
4. **All validation** through Zod schemas (`lib/validators/*.schema.ts`)
5. **All UI components** in `_components/` inside each route segment
6. **No `any` types** — everything fully typed
7. **Reusable UI** — use `components/ui/` (shadcn) and `components/shared/`

### ⚠️ RLS + Data Access Rule (CRITICAL)

**Drizzle ORM (postgres.js) does NOT bypass RLS.** Direct postgres connection has `auth.role() = anon`, so any table with RLS enabled will block the query.

**Rule**: In ALL server-side repositories, use `createAdminClient()` (Supabase Service Role Key) instead of Drizzle ORM:

```ts
// ❌ WRONG — Drizzle blocks on RLS tables
import { db } from '@/lib/db';
const result = await db.select().from(paymentItems);

// ✅ CORRECT — Admin client bypasses RLS
import { createAdminClient } from '@/lib/supabase/server';
const admin = await createAdminClient();
const { data } = await admin.from('payment_items').select('*');
```

**Drizzle ORM** is only safe for: schema definitions (`lib/db/schema/`) and migrations.
**Supabase Admin Client** is always safe for: all server-side data reads/writes.

### File Structure

```
app/
  (auth)/              # No sidebar: login, lock
  (dashboard)/         # With sidebar: all protected routes
    layout.tsx         # Sidebar + TopBar + main
    page.tsx           # Dashboard (thin)
    students/
      page.tsx         # Registry (thin)
      _components/     # Module-specific components
      [id]/
        page.tsx       # Profile (thin)
        _components/

lib/
  supabase/           # client.ts, server.ts, middleware.ts
  auth/               # session.ts, config.ts, guard.ts
  db/schema/          # Drizzle table definitions
  repositories/       # Data access (Drizzle queries)
  services/           # Business logic
  actions/            # Server Actions (mutation endpoints)
  validators/         # Zod schemas

components/
  ui/                 # shadcn/ui components (auto-generated)
  shared/             # Reusable app components
  layout/             # Sidebar, TopBar, Breadcrumbs

types/                # TypeScript type definitions
```

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 15 (App Router, Server Components) |
| Language | TypeScript (strict) |
| ORM | Drizzle ORM |
| Database | Supabase PostgreSQL |
| Auth | Supabase Auth SSR + RBAC |
| UI | shadcn/ui + Tailwind CSS |
| Charts | Recharts |
| Tables | TanStack Table |
| Drag & Drop | @dnd-kit |
| Validation | Zod + react-hook-form |
| State | Zustand (client-side only) |

## Database Schema

10 tables: `branches`, `students`, `enrollments`, `contracts`, `payment_items`, `payment_transactions`, `collection_tasks`, `withdrawal_cases`, `audit_logs`, `user_roles`

Key fields added in migration:
- `contracts.contract_number` — physical contract number (e.g., "35-26")
- `contracts.status` — active/completed/cancelled
- `contracts.previous_contract_id` — contract renewal chain
- `payment_items.label` — month display name ("Июнь", "Сентябрь")
- `students.email`, `students.notes`
- `enrollments.status` — includes 'completed' for year-end

## RBAC Roles

| Role | Key Permissions |
|------|----------------|
| admin | Full access |
| finance_manager | Finance + analytics + approvals |
| accountant | Payments + transactions |
| call_center | Collections + student contacts + contracts (read-only) |
| assistant | Student registry (grouped by class) + enrollments |

## Current Development Status

**Track progress in Linear**: Project `Production SRM v1`, Team `Intellect Srm`

Check Linear issues with identifiers INT1-14 through INT1-32 for current status.

### Phase Order
1. **Phase 1**: Infrastructure (INT1-14 → INT1-19) — CURRENT
2. **Phase 2**: Core Modules (INT1-20 → INT1-28)
3. **Phase 3**: Advanced (INT1-29 → INT1-31)
4. **Phase 4**: Polish (INT1-32)

## Key Business Context

- **Students view**: Call-center sees flat table; Assistant sees grouped by class (grade)
- **Collections**: Monthly columns (июнь..апрель) like current Google Sheets
- **Import**: CSV from Google Sheets → 4-step wizard → bulk insert
- **Year Transition**: Batch promote students (5А→6А) + renew contracts
- **Contract renewal**: Creates chain via `previous_contract_id`, carries over balance
- **Currency**: KGS (сом), formatted with space separators

## Design Reference

- UI Spec: `/docs/stitch-screens/ui-specification.md`
- Stitch screens: `/docs/stitch-screens/`
- PRD: `/PRD.md`

## Before You Code

1. Check Linear for current issue status
2. Follow the architecture strictly (thin page.tsx → service → repo)
3. Use Drizzle ORM, never raw Supabase client in business code
4. Validate all inputs with Zod
5. Add audit logs for mutations
6. Test with existing seed data

## ⚠️ Mandatory Verification (STRICT)

**After completing ANY stage that involves UI or functionality (Phase 2+), you MUST:**

1. **Ensure `npm run dev` is running** (port 3000)
2. **Open the browser** and navigate to the relevant page(s)
3. **Visually verify** the UI renders correctly (no blank screens, no console errors)
4. **Functionally test** CRUD operations, navigation, form submissions
5. **Take a screenshot** as proof of working state
6. **Only then** mark the Linear issue as Done

**Do NOT skip browser verification.** A stage is NOT complete until it's verified in the browser.

### Verification checklist per stage type:

| Stage Type | Must Verify |
|------------|------------|
| Layout/Navigation | Sidebar renders, links navigate, responsive works |
| CRUD Page | Create → appears in list, Edit → saves, Delete → removed |
| Dashboard | Widgets load real data, no loading spinners stuck |
| Table/Filters | Data loads, filters work, pagination works, sorting works |
| Forms | Validation errors show, submit works, success feedback |
| Auth | Login → redirect, unauthorized → /login, role filtering |
| Import | Upload → preview → import → data visible in registry |
