# School CRM Prototype

Прототип CRM для частной школы на стеке Next.js + TypeScript.

## Что реализовано в прототипе
- Единая база учеников
- Долгоживущая модель ученика (переходы по годам/классам)
- Договоры и гибкие графики оплаты
- Очередь колл-центра по задолженностям
- Кейс выбытия с перерасчетом
- Базовый операционный дашборд
- Страница отчетов (`aging`, `plan/fact`, `collection performance`)
- Supabase-backed API для students/enrollments/contracts/payments/collections/withdrawals
- Audit log записи на create/update/delete мутации
- Реальный login/logout через Supabase Auth (email/password)
- Авто-роль пользователя из таблицы `user_roles`
- Защита страниц и API через middleware + серверный RBAC guard
- Админ-панель управления пользователями (`/settings/users`): создание аккаунтов и назначение ролей

## Запуск
```bash
npm install
npm run dev
```

Откройте `http://localhost:3000`.

## Auth setup (обязательно)
1. Создайте пользователей в Supabase Auth (Email/Password).
2. Примените `db/schema.sql`, чтобы создать таблицу `user_roles`.
3. Назначьте роли пользователям:

```sql
insert into public.user_roles (user_id, role)
values
  ('<auth_user_uuid>', 'assistant');
```

Доступные роли: `assistant | call_center | accountant | finance_manager | admin`.

После входа админом:
- Откройте `/settings/users`
- Создайте сотрудника (`email + пароль + роль`)
- При необходимости меняйте роль в таблице пользователей

## Текущий статус
- Реальные данные учеников и финансового снапшота читаются из Supabase.
- Моки остаются как fallback-слой для старых экранов/демо-данных.
- Следующий шаг: полный отказ от моков и переход всех экранов/действий на Supabase CRUD.

## API (prototype)
- `GET/POST /api/students`
- `GET/PATCH /api/students/:id`
- `GET /api/students/:id/finance`
- `POST /api/enrollments`
- `POST /api/contracts`
- `PATCH/DELETE /api/contracts/:id`
- `POST /api/payment-items`
- `PATCH/DELETE /api/payment-items/:id`
- `POST /api/collections`
- `POST /api/withdrawals`
- `PATCH/DELETE /api/withdrawals/:id`
- `GET /api/branches`
- `GET /api/reports/overview`
- `GET/POST/PATCH /api/admin/users` (только admin)

Для mutation API используется RBAC-проверка:
- В production роль берется из серверной сессии (cookie), установленной после login.
- Заголовок `x-role` используется только в e2e/test режиме.

## Supabase security
- RLS baseline SQL: `db/rls_policies.sql`
- Применяйте после `db/schema.sql`

## E2E browser tests (Playwright)
```bash
npm run test:e2e
```
