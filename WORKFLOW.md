# Оптимальный Workflow для разработки с ИИ агентами

> Практичный, масштабируемый процесс разработки production-ready продуктов с помощью Claude Code и других ИИ агентов

---

## 🎯 Принципы работы

1. **Ясность прежде всего** - ИИ работает лучше с четкими требованиями
2. **Итеративность** - развивайте фичи маленькими шагами
3. **Документируйте всё** - помните о контексте будущих сессий
4. **Тестируйте сразу** - не ждите конца разработки
5. **Автоматизируйте процессы** - пусть инструменты работают за вас

---

## 📊 Фазы разработки

### Фаза 1: Планирование (1-2 дня)

#### 1.1 Создание PRD
```bash
# Заполните шаблон PRD.md с полной информацией о продукте
# Включите:
# - Видение и цели
# - User stories
# - Метрики успеха
# - Технический стек
# - План по фазам
```

**Чеклист**:
- [ ] Видение продукта четко описано
- [ ] Target audience определена
- [ ] MVP features перечислены
- [ ] Success metrics установлены
- [ ] Tech stack выбран
- [ ] User stories написаны

#### 1.2 Архитектурное планирование
```bash
# Создайте диаграмму архитектуры (в PRD)
# Определите:
# - Основные компоненты
# - Data flow
# - External integrations
# - Scalability concerns
```

#### 1.3 Setup CLAUDE.md
```bash
# Скопируйте и заполните шаблон CLAUDE.md
# Это станет источником истины для ИИ агентов
# Включите:
# - Архитектуру системы
# - Структуру проекта
# - Команды для разработки
# - Best practices
```

### Фаза 2: Setup окружения (1 день)

#### 2.1 Инициализация проекта
```bash
# Создайте базовую структуру
npm init -y
mkdir -p src/{api,services,models,utils,config}
mkdir -p tests/{unit,integration,e2e}
mkdir -p docs
mkdir -p migrations
mkdir -p scripts

# Установите core dependencies
npm install express dotenv cors axios
npm install -D jest supertest nodemon
```

#### 2.2 Git setup
```bash
git init
git config user.name "Your Name"
git config user.email "your.email@example.com"

# Создайте .gitignore
cat > .gitignore << EOF
node_modules/
.env
.env.local
dist/
build/
logs/
.DS_Store
*.log
EOF

# Первый коммит
git add .
git commit -m "chore: project initialization"
```

#### 2.3 Docker setup
```bash
# Создайте Dockerfile для development
# Создайте docker-compose.yml для локального окружения
# Включите services: app, database, cache (если нужно)
```

**Чеклист**:
- [ ] Project структура создана
- [ ] Dependencies установлены
- [ ] Git инициализирован
- [ ] Docker готов для development
- [ ] .env.example создан
- [ ] README.md написан

---

### Фаза 3: Core Development (2-4 недели)

#### 3.1 Спринт-ориентированная разработка

**Один спринт = 1 неделя работы с ИИ**

```
Спринт 1: Database schema + API foundation
├── Day 1: Design database schema
├── Day 2: Create migrations
├── Day 3: Setup API router structure
├── Day 4: Authentication service
└── Day 5: Tests + Documentation

Спринт 2: Core features (Feature 1 + Feature 2)
├── Day 1: Design & plan features
├── Day 2: Implement Feature 1
├── Day 3: Implement Feature 2
├── Day 4: Integration testing
└── Day 5: Refactor & optimize

Спринт 3: Additional features + Optimization
├── Day 1-2: Feature 3 & 4
├── Day 3: Performance optimization
├── Day 4: Security audit
└── Day 5: Load testing
```

#### 3.2 Для каждой feature:

**Шаг 1: Планирование (1-2 часа)**
```bash
# В чате с Claude Code:
# 1. Опишите требование (user story)
# 2. Скажите где находится архитектура (CLAUDE.md)
# 3. Укажите соответствующие компоненты
# 4. Попросите план разработки

Пример промпта:
"Реализуй User Authentication с JWT.
Контекст в CLAUDE.md (посмотри архитектуру).
Нужны:
1. Регистрация пользователя
2. Логин с JWT токеном
3. Protected routes middleware
4. Unit тесты для сервиса

Создай план разработки."
```

**Шаг 2: Реализация (4-6 часов)**
```bash
# Claude Code будет:
# 1. Читать PRD.md для контекста
# 2. Использовать CLAUDE.md как guide
# 3. Создавать файлы в правильных местах
# 4. Писать тесты одновременно с кодом
# 5. Обновлять документацию

# Ваша роль:
# 1. Рецензировать код (code review)
# 2. Тестировать функциональность
# 3. Давать обратную связь
# 4. Одобрять мёржи
```

**Шаг 3: Тестирование (2-3 часа)**
```bash
# Запустить все тесты
npm test

# Проверить покрытие
npm run test:coverage

# Интеграционное тестирование
npm run test:integration

# Manual QA
# - Используйте Postman/Insomnia для API testing
# - Проверьте edge cases
# - Валидируйте error handling
```

**Шаг 4: Review & Merge (1 час)**
```bash
# Code review
# - Читаемость кода
# - Следование best practices
# - Performance considerations
# - Security issues

# Merge в main
git merge --squash feature/branch
git push origin main
```

#### 3.3 Коммуникация с ИИ агентами

**Эффективный промпт для feature разработки:**

```markdown
## Feature: [Feature Name]

### Требование
[Описание, что нужно сделать]

### User Story
Как [пользователь]
Я хочу [действие]
Чтобы [результат]

### Критерии приёма
- [ ] Критерий 1
- [ ] Критерий 2
- [ ] Unit тесты (>80% покрытие)
- [ ] Интеграционные тесты
- [ ] Документирована в docs/

### Где это нужно?
[Опишите где в архитектуре, иначе скажи что в CLAUDE.md]

### Зависимости
- [Зависит от Feature X]
- [Требует Database table Y]

### Constraints
- [Должно работать с существующим кодом Z]
- [Должно следовать паттерну W]
```

---

### Фаза 4: Testing & QA (3-5 дней на финал)

#### 4.1 Unit тесты
```bash
# Все сервисы должны иметь unit тесты
npm test -- --coverage

# Coverage должен быть >80% для production code
```

#### 4.2 Integration тесты
```bash
# Тестируйте interaction между компонентами
# API + Database
# Auth + Protected routes
npm run test:integration
```

#### 4.3 E2E тесты (опционально для MVP)
```bash
# Full user workflows
# Используйте Cypress или Playwright
npm run test:e2e
```

#### 4.4 Performance тесты
```bash
# Используйте Apache Bench или k6
ab -n 1000 -c 10 http://localhost:3000/api/endpoint

# Проверьте:
# - Response time
# - Memory usage
# - Database query performance
```

#### 4.5 Security тесты
```bash
# Dependency check
npm audit

# OWASP check
npm run security-check

# Manual penetration testing (если critical)
```

---

### Фаза 5: Deployment & Monitoring (2-3 дня)

#### 5.1 Pre-production setup
```bash
# Создайте staging окружение
# - Идентично production
# - Но с test данными
# - Используйте для final testing

# Deploy на staging
npm run deploy:staging
```

#### 5.2 Production deployment
```bash
# Final checks
npm run build
npm run test
npm run lint

# Create production build
docker build -t app:latest .

# Push на реджистри
docker push registry.com/app:latest

# Deploy на production
# - Используйте kubernetes или similar
# - Setup rolling deployment
# - Health checks
# - Monitoring alerts
```

#### 5.3 Post-deployment
```bash
# Мониторинг
- Setup error tracking (Sentry)
- Setup APM (New Relic, DataDog)
- Setup logging (ELK, CloudWatch)
- Setup alerts

# Проверки
- Проверьте logs на ошибки
- Мониторьте performance metrics
- Проверьте user behavior
```

---

## 🤖 Как работать с ИИ агентами

### Структура сессии работы

#### Начало сессии
```
1. Загружаю контекст:
   "Мы работаем над [project name].
   Архитектура в /path/to/CLAUDE.md
   Требования в /path/to/PRD.md"

2. Даю задачу:
   "Реализуй [feature] согласно требованиям.
   Используй структуру из CLAUDE.md.
   Включи тесты."

3. Жду результата:
   - ИИ читает CLAUDE.md
   - ИИ читает PRD.md
   - ИИ создает файлы в правильных местах
   - ИИ пишет тесты
```

#### Эффективные промпты

**ДО (Плохо)**:
```
"Напиши API для юзеров"
```

**ПОСЛЕ (Хорошо)**:
```
"Создай API endpoint для регистрации пользователя.

Требования (из PRD.md, Section 6):
- POST /api/auth/register
- Параметры: email, password, name
- Валидация email формата
- Хеширование пароля bcrypt
- JWT token в ответе
- Проверка на дублирование email

Где это нужно:
- Service: src/services/auth.js
- Endpoint: src/api/endpoints/auth.js
- Tests: tests/unit/services/auth.test.js
- Database: users table (уже существует)

Требуемый формат ответа:
{
  success: true,
  data: {
    user: { id, email, name },
    token: "jwt_token_here"
  }
}

Error handling:
- 400 если email already exists
- 400 если invalid email format
- 500 для server errors

Не забудь:
- Unit тесты
- Input валидация
- Обновить docs/api.md
"
```

### Types of ИИ agents для разных задач

#### 1. Claude Code (для разработки)
```
Используйте для:
- Написания features
- Bug fixes
- Refactoring
- Tests writing

Промпт:
"[Feature описание]
Архитектура в CLAUDE.md, раздел [раздел]
Используй [технология]
Включи тесты"
```

#### 2. Claude (for reasoning/planning)
```
Используйте для:
- Архитектурного планирования
- Troubleshooting
- Code review
- Performance optimization

Промпт:
"[Проблема описание]
Контекст: [описание]
Дай детальный план решения"
```

#### 3. Automated testing agents
```
Используйте для:
- Запуска тестов
- Coverage reports
- Performance testing

В CI/CD pipeline
```

---

## 📈 Масштабирование на production

### Архитектурные паттерны для scale

#### 1. Horizontal Scaling
```
Load Balancer
├── App Server 1
├── App Server 2
├── App Server 3
└── App Server 4

Database (Primary-Replica)
├── Write: Primary
└── Read: Replicas
```

#### 2. Microservices (если нужно)
```
API Gateway
├── Auth Service
├── User Service
├── Content Service
├── Notification Service
└── Analytics Service

Shared Resources:
├── Message Queue (RabbitMQ)
├── Cache Layer (Redis)
└── Central Database
```

#### 3. Asynchronous Processing
```
Web Request
├── API accepts request
├── Adds task to queue
└── Returns 202 (Accepted)

Background Workers
├── Process queue tasks
├── Update database
└── Trigger webhooks
```

### Database optimization для scale

```sql
-- Индексы для часто используемых queries
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_posts_user_id ON posts(user_id);
CREATE INDEX idx_comments_post_id ON comments(post_id);

-- Partition для больших таблиц
PARTITION BY RANGE (created_at) FOR posts table

-- Read replicas для analytics queries
REPLICA servers для SELECT-only queries
```

### Caching strategy

```javascript
// 3-tier caching approach
1. Application cache (Redis)
   - Cache DB queries
   - Cache API responses
   - TTL: 1-24 hours

2. HTTP cache (Nginx/CDN)
   - Cache static assets
   - Cache API responses
   - TTL: 1 hour - 7 days

3. Browser cache
   - Static files
   - Service Worker cache
   - TTL: 30 days
```

### Monitoring для production

```bash
# Essential metrics
- Response time (p50, p95, p99)
- Error rate
- Throughput (requests/sec)
- CPU usage
- Memory usage
- Database connections
- Queue depth (if using queues)

# Tools
- Datadog / New Relic for APM
- Prometheus + Grafana for metrics
- ELK stack for logs
- Sentry for error tracking
```

---

## 🔄 Continuous Improvement

### Weekly Review Process

```
Friday (1 hour):
1. Review completed features
2. Check metrics:
   - Performance
   - Error rates
   - User feedback
3. Identify optimizations
4. Plan next week
```

### Monthly Retrospective

```
Last Friday of month (2 hours):
1. What went well?
2. What didn't work?
3. What can we improve?
4. Update processes
5. Update documentation
```

---

## ✅ Чеклист для production-ready продукта

### Code Quality
- [ ] >80% test coverage
- [ ] Zero critical security issues
- [ ] All unit tests pass
- [ ] All integration tests pass
- [ ] Code review approved
- [ ] Linting passes
- [ ] No type errors

### Documentation
- [ ] README.md complete
- [ ] API documentation updated
- [ ] Architecture docs updated
- [ ] Deployment guide written
- [ ] CLAUDE.md updated
- [ ] CHANGELOG updated

### Infrastructure
- [ ] Database migrations created
- [ ] Backup strategy defined
- [ ] Monitoring alerts setup
- [ ] Logging configured
- [ ] Error tracking enabled
- [ ] Performance baselines set

### Security
- [ ] Security audit passed
- [ ] Dependencies scanned
- [ ] Secrets not in code
- [ ] HTTPS enforced
- [ ] CORS configured
- [ ] Rate limiting enabled
- [ ] Input validation added

### Performance
- [ ] Load testing done
- [ ] Database optimized (indexes)
- [ ] Caching implemented
- [ ] CDN configured (if needed)
- [ ] Response time <500ms

### Deployment
- [ ] Staging environment tested
- [ ] Rollback plan created
- [ ] Deployment automated
- [ ] Health checks working
- [ ] Monitoring active

---

## 🚀 Launch Checklist

```
48 hours before launch:
- [ ] Final code review
- [ ] Full regression testing
- [ ] Performance test on staging
- [ ] Security audit
- [ ] Backup database
- [ ] Notify team

24 hours before launch:
- [ ] Final monitoring setup
- [ ] Alert testing
- [ ] Runbooks prepared
- [ ] Team on standby scheduled

At launch:
- [ ] Deploy to production
- [ ] Monitor metrics
- [ ] Check error logs
- [ ] Monitor user behavior
- [ ] Team available for hotfixes

Post-launch:
- [ ] Daily monitoring for 1 week
- [ ] Weekly review for 1 month
- [ ] Performance analysis
- [ ] User feedback collection
```

---

## 📚 Документация которая должна быть

```
docs/
├── README.md              # Project overview
├── architecture.md        # System architecture
├── api.md                # API documentation (auto-generated if possible)
├── database.md           # Database schema & queries
├── deployment.md         # How to deploy
├── monitoring.md         # Monitoring setup
├── troubleshooting.md    # Common issues & solutions
├── contributing.md       # How to contribute
└── faq.md               # Frequently asked questions
```

---

## 🎓 Summary

**Optimal workflow для production products:**

1. **Plan thoroughly** (PRD + Architecture)
2. **Document clearly** (CLAUDE.md for AI agents)
3. **Develop iteratively** (1-week sprints)
4. **Test continuously** (unit + integration + e2e)
5. **Deploy safely** (staging → production)
6. **Monitor religiously** (metrics + alerts)
7. **Improve constantly** (retrospectives + optimization)

Ключ к успеху - **четкая коммуникация с ИИ агентами через хорошо структурированную документацию**.
