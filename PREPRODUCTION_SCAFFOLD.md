# Preproduction SRM Scaffold

Этот документ фиксирует каркасные контракты, чтобы дизайн можно было быстро натянуть поверх существующей логики.

## Core Shell Contracts

- `PageShell`: заголовок страницы, subtitle, action-slot, content-slot.
- `SectionShell`: локальная секция с title/subtitle/actions.
- `TableShell`: единый контейнер для таблиц.
- `StateBlock`: shared row-state для `loading | empty | error`.

## Implemented Pages (Preprod Contract)

- `app/students/page.tsx`
- `app/assistant/page.tsx`
- `app/finance/page.tsx`

Все страницы выше уже используют shell-слоты и не зависят от финального визуального языка.

## Design Handoff Mapping

1. `PageShell` -> page header/frame из дизайн-системы.
2. `SectionShell` -> reusable section group.
3. `TableShell` -> data grid container.
4. `.actions` внутри shell -> toolbar/action row.
5. `StateBlock` -> empty/loading/error template rows.

## Integration Rule

При подключении финального дизайна:
- менять компоненты shell и CSS tokens,
- не менять API вызовы и бизнес-ветки в page логике,
- не смешивать декоративные изменения с RBAC/Auth/data layer.
