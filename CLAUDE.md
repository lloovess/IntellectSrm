# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

---

## 📋 Обзор проекта

**Проект**: [Название]
**Описание**: [Краткое описание того, что делает проект]
**Тип**: [Web App / Mobile App / Backend Service / Library / etc]

---

## 🏗️ Архитектура системы

### Высокоуровневая архитектура

```
┌─────────────────────────────────────────────────────────────────┐
│                        СИСТЕМА                                   │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌──────────────┐         ┌──────────────┐                      │
│  │   Frontend   │ ────▶   │  API Layer   │                      │
│  │  (Client)    │         │  (REST/GQL)  │                      │
│  └──────────────┘         └──────────────┘                      │
│                                   │                               │
│                                   ▼                               │
│  ┌──────────────┐         ┌──────────────┐                      │
│  │ Auth Service │ ────▶   │ Business     │                      │
│  │              │         │ Logic Layer  │                      │
│  └──────────────┘         └──────────────┘                      │
│                                   │                               │
│                                   ▼                               │
│  ┌──────────────┐         ┌──────────────┐         ┌──────────┐ │
│  │ External API │ ────▶   │ Data Layer   │ ────▶   │ Database │ │
│  │              │         │ (ORM/Query)  │         │          │ │
│  └──────────────┘         └──────────────┘         └──────────┘ │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

### Основные компоненты

| Компонент | Назначение | Технология | Владелец |
|-----------|-----------|-----------|----------|
| [Компонент 1] | [Описание] | [Tech stack] | [Owner] |
| [Компонент 2] | [Описание] | [Tech stack] | [Owner] |
| [Компонент 3] | [Описание] | [Tech stack] | [Owner] |

### Структура проекта

```
project-root/
├── docs/                    # Документация
│   ├── architecture.md     # Архитектура системы
│   ├── api.md             # API документация
│   └── deployment.md      # Инструкции по развёртыванию
│
├── src/                     # Исходный код
│   ├── api/               # REST/GraphQL endpoints
│   ├── services/          # Бизнес-логика
│   ├── models/            # Data models, schemas
│   ├── utils/             # Утилиты и хелперы
│   ├── middleware/        # Auth, logging, etc
│   └── config/            # Конфигурация
│
├── tests/                   # Тесты
│   ├── unit/              # Unit тесты
│   ├── integration/       # Integration тесты
│   └── e2e/               # End-to-end тесты
│
├── migrations/             # Database migrations
├── scripts/                # Utility scripts
│
├── .env.example           # Example environment variables
├── README.md              # Project README
├── package.json           # Dependencies (Node.js)
├── docker-compose.yml     # Local development setup
├── Dockerfile             # Production container
│
└── CLAUDE.md              # ЭТО ФАЙЛ (guidance for AI)
```

---

## 🚀 Команды разработки

### Setup проекта

```bash
# Клонирование репозитория
git clone [repository-url]
cd project-name

# Установка зависимостей
npm install
# или для Python: pip install -r requirements.txt

# Подготовка локального окружения
cp .env.example .env
# Отредактируйте .env с локальными значениями

# Запуск миграций БД (если необходимо)
npm run migrate:dev
```

### Разработка

```bash
# Запуск dev сервера
npm run dev
# URL: http://localhost:3000

# Запуск всех тестов
npm test

# Запуск тестов в режиме watch
npm run test:watch

# Запуск одного тестового файла
npm test -- src/services/auth.test.js

# Линтинг кода
npm run lint

# Форматирование кода
npm run format

# Type checking (если используется TypeScript)
npm run type-check
```

### Сборка и деплой

```bash
# Production сборка
npm run build

# Preview production build локально
npm run preview

# Запуск production версии
npm start

# Docker сборка
docker build -t project-name:latest .
docker run -p 3000:3000 project-name:latest
```

### Помощь

```bash
# Посмотреть все доступные команды
npm run
```

---

## 🔑 Ключевые архитектурные паттерны

### 1. [Паттерн 1 - например: MVC]
**Где используется**: [В каких компонентах]
**Почему**: [Причина использования]
**Пример**:
```
Controller → Service → Repository → Database
```

### 2. [Паттерн 2 - например: Dependency Injection]
**Где используется**: [В каких компонентах]
**Как работает**: [Краткое объяснение]

### 3. [Паттерн 3 - например: Event-Driven Architecture]
**Где используется**: [В каких компонентах]
**Преимущества**: [Масштабируемость, слабая связанность]

---

## 📁 Где найти что

### Как добавить новый API endpoint?
1. Создайте файл в `src/api/endpoints/[feature].js`
2. Добавьте бизнес-логику в `src/services/[feature].js`
3. Добавьте тесты в `tests/unit/services/[feature].test.js`
4. Зарегистрируйте route в `src/api/router.js`
5. Документируйте в `docs/api.md`

### Как добавить новый сервис?
1. Создайте класс/функцию в `src/services/[name].js`
2. Напишите unit тесты в `tests/unit/services/[name].test.js`
3. Интегрируйте в соответствующие endpoints

### Как добавить миграцию БД?
```bash
npm run migrate:create -- create_[table_name]_table
# Отредактируйте файл миграции в migrations/
npm run migrate:dev
```

### Где конфигурация?
- **Локальная**: `.env` (git-ignored)
- **Дефолтная**: `src/config/default.js`
- **Environment-specific**: `src/config/[production|staging|development].js`

---

## 🧪 Тестирование

### Стратегия тестирования

| Тип | Охват | Где | Команда |
|-----|-------|-----|---------|
| Unit | Services, Utils | `tests/unit/` | `npm test` |
| Integration | API + Database | `tests/integration/` | `npm run test:integration` |
| E2E | User flows | `tests/e2e/` | `npm run test:e2e` |

### Best Practices

1. **Unit тесты**: Тестируйте отдельные функции без зависимостей
2. **Mocking**: Используйте mocks для внешних сервисов
3. **Fixtures**: Создавайте тестовые данные в `tests/fixtures/`
4. **Coverage**: Aim for >80% для критичного кода

### Пример test структуры

```javascript
describe('AuthService', () => {
  describe('login', () => {
    it('should authenticate user with valid credentials', async () => {
      // Arrange
      const user = { email: 'test@example.com', password: 'pass123' };

      // Act
      const result = await AuthService.login(user);

      // Assert
      expect(result.token).toBeDefined();
      expect(result.user.email).toBe(user.email);
    });

    it('should reject invalid credentials', async () => {
      // Arrange
      const user = { email: 'test@example.com', password: 'wrong' };

      // Act & Assert
      await expect(AuthService.login(user)).rejects.toThrow();
    });
  });
});
```

---

## 🐛 Debugging

### Логирование

```javascript
// Используйте структурированное логирование
logger.info('User logged in', { userId: user.id, timestamp: new Date() });
logger.error('Database error', { error, query });
logger.debug('Processing request', { endpoint, method });
```

### Просмотр логов

```bash
# Dev логи в консоли
npm run dev

# Production логи
tail -f logs/app.log
```

### Debugger

```javascript
// Добавьте breakpoint и запустите с дебаггером
node --inspect-brk src/index.js
# Откройте chrome://inspect
```

---

## 📚 Технический стек

### Backend
- **Runtime**: [Node.js / Python / Java]
- **Framework**: [Express / FastAPI / Spring]
- **ORM**: [Sequelize / SQLAlchemy / Hibernate]
- **Auth**: [JWT / OAuth / Sessions]

### Frontend (если есть)
- **Framework**: [React / Vue / Angular]
- **Build**: [Webpack / Vite / Next.js]
- **State**: [Redux / Vuex / Context API]
- **HTTP Client**: [Axios / Fetch / Tanstack Query]

### Database
- **Primary**: [PostgreSQL / MySQL / MongoDB]
- **Cache**: [Redis]
- **Search**: [Elasticsearch / Algolia]

### DevOps
- **Containerization**: [Docker]
- **Orchestration**: [Kubernetes / Docker Compose]
- **CI/CD**: [GitHub Actions / GitLab CI / Jenkins]
- **Hosting**: [AWS / GCP / Azure / Vercel]

---

## 🔐 Безопасность

### Важные правила

1. **Никогда** не коммитьте `.env` файлы с реальными секретами
2. **Всегда** валидируйте input от пользователей
3. **Используйте** HTTPS в production
4. **Защищайте** API с rate limiting и CORS
5. **Логируйте** security events
6. **Обновляйте** dependencies регулярно

### Команды безопасности

```bash
# Проверить уязвимости в зависимостях
npm audit

# Автоисправление известных уязвимостей
npm audit fix

# Проверить код с помощью security linter
npm run security-check
```

---

## 💾 База данных

### Schema

Основные таблицы:
- `users` - Учётные записи пользователей
- `[table2]` - Описание
- `[table3]` - Описание

### Миграции

```bash
# Создать новую миграцию
npm run migrate:create -- name_of_migration

# Запустить pending миграции
npm run migrate:up

# Откатить последнюю миграцию
npm run migrate:down

# Статус миграций
npm run migrate:status
```

### Backup и восстановление

```bash
# Backup
pg_dump dbname > backup.sql

# Restore
psql dbname < backup.sql
```

---

## 🔄 Git Workflow

### Branch naming convention

```
feature/[issue-id]-short-description
bugfix/[issue-id]-short-description
hotfix/[issue-id]-short-description
refactor/short-description
```

### Commit messages

```
[TYPE] [SCOPE]: Brief description (max 50 chars)

Optional detailed explanation if needed.

- Bullet point details
- More context

Refs: #issue-id
```

**Types**: `feat`, `fix`, `refactor`, `test`, `docs`, `chore`

### Процесс разработки

1. Создайте feature branch: `git checkout -b feature/xxx`
2. Делайте коммиты: `git commit -m "[feat]: description"`
3. Пушьте: `git push origin feature/xxx`
4. Откройте Pull Request
5. Пройдите code review
6. Мёржьте в main: `git merge --squash`

---

## 🚨 Common Pitfalls и Solutions

### Проблема 1: Большие N+1 queries
**Решение**: Используйте JOIN или eager loading в ORM
```javascript
// ❌ Плохо
const users = await User.findAll();
users.forEach(u => u.posts); // N+1 queries

// ✅ Хорошо
const users = await User.findAll({ include: 'posts' });
```

### Проблема 2: Memory leaks в workers
**Решение**: Всегда очищайте listeners и timers
```javascript
// Убедитесь, что очищаете resources
worker.on('message', handler);
// Позже:
worker.removeListener('message', handler);
```

### Проблема 3: Race conditions в concurrent requests
**Решение**: Используйте database constraints и transactions
```javascript
await db.transaction(async (trx) => {
  await User.query().transacting(trx).update({ balance });
});
```

### Проблема 4: Недостаточное логирование в production
**Решение**: Логируйте ошибки и важные события
```javascript
try {
  // код
} catch (error) {
  logger.error('Critical error occurred', { error, context });
}
```

---

## 📞 Контакты и Ссылки

- **Документация**: [docs/](./docs/)
- **API Docs**: [docs/api.md](./docs/api.md)
- **Architecture**: [docs/architecture.md](./docs/architecture.md)
- **Issue Tracker**: [GitHub Issues]
- **Slack Channel**: [#project-name]
- **Wiki**: [Project Wiki]

---

## 📝 Версионирование

**Версия**: 1.0
**Последнее обновление**: [Дата]
**Автор**: [Имя]

### Изменения версий

| Версия | Дата | Что изменилось |
|--------|------|----------------|
| 1.0 | [Дата] | Initial version |
