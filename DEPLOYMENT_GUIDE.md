# 🚀 DEPLOYMENT GUIDE - Готовность к production

**Дата**: 17 марта 2026
**Версия**: 0.1.0
**Статус**: Готово к стейджингу после исправления ESLint ошибок

---

## 📋 ПРЕДВАРИТЕЛЬНЫЕ ТРЕБОВАНИЯ

### Серверные требования (для small team < 100 пользователей)

```
Развертывание: 2-3 часа
Стоимость: ~$15-30/месяц (Vercel Free/Hobby)
Поддержка: 1 junior dev

Минимальные ресурсы:
- Node.js 18+ runtime
- 512MB RAM
- 2GB SSD (для .next)
- 1 vCPU достаточно
```

### Рекомендованный Stack для Production

| Компонент | Рекомендация | Причина |
|-----------|------------|--------|
| **Хостинг** | Vercel или Netlify | Next.js оптимизирован |
| **Database** | Supabase (текущее) | ✅ Уже настроено |
| **Auth** | Supabase Auth (текущее) | ✅ Работает правильно |
| **CDN** | Cloudflare | Бесплатно, быстро |
| **Monitoring** | Sentry + Vercel | Логирование + обновления |
| **Backup** | Supabase Auto Backup | Ежедневные снимки |

---

## 🚢 ДЕПЛОЙ НА VERCEL (Рекомендуется)

### Шаг 1: Подготовка GitHub репозитория

```bash
# Инициализировать git (если еще нет)
git init
git add .
git commit -m "Initial commit - School CRM"

# Создать репозиторий на GitHub
# https://github.com/new

git remote add origin https://github.com/YOUR_USERNAME/school-crm.git
git branch -M main
git push -u origin main
```

### Шаг 2: Подключить к Vercel

1. Перейти на https://vercel.com
2. Нажать "New Project"
3. Выбрать GitHub репозиторий
4. Настроить переменные окружения:

```env
# .env.production (заполнить на Vercel)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Опционально
SENTRY_DSN=https://your-sentry-dsn
NEXT_PUBLIC_APP_URL=https://your-domain.com
```

### Шаг 3: Настроить домен

1. На Vercel: Project Settings > Domains
2. Добавить: `school-crm.yourdomain.com` или `crm.intellect-school.kz`
3. Следовать инструкциям DNS

### Шаг 4: Первый деплой

```bash
# Vercel автоматически деплоит при push в main
git push origin main

# Проверить статус на https://vercel.com/dashboard
# Когда статус "Ready" - приложение в air 🎉
```

---

## 🌐 ALTERNATIVE: САМОСТОЯТЕЛЬНЫЙ ХОСТИНГ

### На DigitalOcean App Platform

```bash
# 1. Создать DigitalOcean аккаунт
# 2. Создать App Platform проект
# 3. Подключить GitHub репозиторий
# 4. Задать build command:
npm run build

# 5. Задать start command:
npm run start

# 6. Добавить environment variables
# 7. Deploy

# Стоимость: ~$5-12/месяц
# Плюсы: полный контроль, простой
# Минусы: нужен DevOps опыт
```

### На Heroku (Legacy)

⚠️ Heroku прекратил бесплатные tier'ы - не рекомендуется

---

## 🔐 SECURITY CHECKLIST

### Перед каждым деплоем проверить:

```
SECURITY:
[ ] Environment variables не коммичены
[ ] .env.local добавлен в .gitignore
[ ] Нет api keys в коде
[ ] Supabase RLS policies включены
[ ] HTTPS enforced на домене
[ ] CORS правильно настроен
[ ] Rate limiting включен
[ ] Audit logs включены

COMPLIANCE:
[ ] Supabase backups настроены
[ ] Logs ротируются
[ ] Sensitive data зашифрована
[ ] Access logs записываются
```

---

## 🔍 МОНИТОРИНГ И АЛЕРТЫ

### 1. Добавить Sentry для Error Tracking

```bash
npm install @sentry/nextjs
```

**Файл**: `sentry.config.ts` (создать)

```typescript
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
  integrations: [
    new Sentry.Replay({
      maskAllText: true,
      blockAllMedia: true,
    }),
  ],
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
});
```

### 2. Настроить Web Vitals логирование

**Файл**: `app/layout.tsx`

```typescript
import { useReportWebVitals } from 'next/web-vitals';

export function reportWebVitals(metric) {
  console.log(metric);

  // Отправить в аналитику
  if (typeof window !== 'undefined') {
    const body = JSON.stringify(metric);
    navigator.sendBeacon('/api/metrics', body);
  }
}
```

### 3. Health Check endpoint

**Файл**: `app/api/health/route.ts` (создать)

```typescript
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Проверить database connection
    const supabase = createClient();
    await supabase.from('students').select('id').limit(1);

    return NextResponse.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version,
    });
  } catch (error) {
    return NextResponse.json(
      { status: 'error', error: String(error) },
      { status: 503 }
    );
  }
}
```

---

## 📊 PERFORMANCE MONITORING

### Метрики для отслеживания

```typescript
// Создать dashboard с этими метриками:

Core Web Vitals:
✓ LCP (Largest Contentful Paint)
  Target: < 2.5s
  Alert if: > 4s for 5+ min

✓ FID (First Input Delay)
  Target: < 100ms
  Alert if: > 300ms for 5+ min

✓ CLS (Cumulative Layout Shift)
  Target: < 0.1
  Alert if: > 0.25 for 5+ min

API Metrics:
✓ Response Time (avg)
  Target: < 500ms
  Alert if: > 2s

✓ Error Rate
  Target: < 0.5%
  Alert if: > 5%

✓ Database Queries
  Target: < 200ms
  Alert if: > 1s
```

### Инструменты мониторинга

```
1. Sentry.io - Error tracking
   - Автоматически ловит ошибки
   - Alerts в Slack/Email
   - Performance monitoring

2. Vercel Analytics (встроен)
   - Core Web Vitals
   - Traffic trends
   - Deployment metrics

3. Supabase Dashboard
   - Database performance
   - API usage
   - Real-time logs

4. UptimeRobot (бесплатно)
   - Ping каждые 5 минут
   - Alert если down
   - Статус страница
```

---

## 🔄 CONTINUOUS DEPLOYMENT

### GitHub Actions (автоматический деплой)

**Файл**: `.github/workflows/deploy.yml` (создать)

```yaml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  build-and-test:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install dependencies
        run: npm ci

      - name: Run tests
        run: npm run test:e2e

      - name: Build
        run: npm run build

      - name: Deploy to Vercel
        uses: vercel/action@master
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
```

---

## 🚨 ROLLBACK ПРОЦЕДУРА

Если deployment сломал production:

### Способ 1: Через Vercel UI
```
1. Vercel Dashboard > Deployments
2. Найти последний работающий deploy
3. Нажать "Promote to Production"
4. ✅ Произойдет откат за 30 секунд
```

### Способ 2: Через Git
```bash
# Откатить последний commit
git revert HEAD
git push origin main

# Vercel автоматически переdeployит
# За 2-3 минуты система вернется в норму
```

### Способ 3: Emergency (если критично)
```bash
# Отключить auto-deploy
# На Vercel: Project Settings > Git > Disable Auto Deploy

# Деплоить вручную
git push origin <stable-commit-hash>:main

# Включить auto-deploy обратно
```

---

## 📈 МАСШТАБИРОВАНИЕ

### От 10 до 100 пользователей
```
Текущая конфигурация достаточна:
- Vercel Free/Hobby tier
- Supabase Free tier (хватит примерно на 100 пользователей)
- Нет доп. оптимизаций нужно

Стоимость: $0 (бесплатное хостинг)
```

### От 100 до 1000 пользователей
```
Нужны апгрейды:

1. Vercel Pro ($20/месяц)
   - Приоритетная поддержка
   - Больше bandwidth
   - Больше builds

2. Supabase Pro ($25/месяц)
   - 500GB storage
   - 2 млн API calls/месяц
   - Priority support

3. Database optimization
   - Добавить индексы
   - Query optimization
   - Connection pooling

Общая стоимость: ~$45-50/месяц
```

### От 1000+ пользователей
```
Архитектура перевода:

1. Dedicated server (DigitalOcean/AWS)
   - Kubernetes для масштабирования
   - Load balancer
   - Multiple instances

2. Database optimization
   - Read replicas для Supabase
   - Redis cache layer
   - Query optimization

3. CDN
   - Cloudflare Enterprise
   - Custom caching rules

4. Dedicated DevOps engineer нужен

Общая стоимость: $500-5000+/месяц
```

---

## 🧹 РЕГУЛЯРНОЕ ОБСЛУЖИВАНИЕ

### Еженедельно
```
[ ] Проверить Sentry errors
[ ] Просмотреть Core Web Vitals
[ ] Проверить database size
[ ] Просмотреть API usage
```

### Ежемесячно
```
[ ] Update dependencies (npm update)
[ ] Проверить security alerts
[ ] Verify backups
[ ] Performance analysis
[ ] Cost review
```

### Ежеквартально
```
[ ] Security audit
[ ] Database optimization
[ ] User feedback review
[ ] Capacity planning
```

### Ежегодно
```
[ ] Complete security assessment
[ ] Architecture review
[ ] Load testing
[ ] Disaster recovery drill
[ ] Compliance check
```

---

## 📞 TROUBLESHOOTING

### Проблема: Vercel deploy fails
```
Проверить:
1. ESLint errors - npm run lint
2. TypeScript errors - npm run type-check
3. Environment variables - все ли set на Vercel?
4. Build output - npm run build локально

Решение:
git push origin main (force rebuild)
```

### Проблема: Slow performance в production
```
Проверить:
1. Lighthouse score
2. Database query times (Supabase logs)
3. API response times (Network tab)
4. CSS/JS bundle sizes

Решение:
1. Включить caching
2. Optimize database queries
3. Compress images
4. Implement pagination
```

### Проблема: Supabase down
```
Признаки:
- API возвращает 503 errors
- Database queries timeout

Проверить:
1. Supabase status page
2. Connection logs
3. Database limits

Решение:
1. Upgrade to Pro if on free tier
2. Implement retry logic
3. Add error handling
```

---

## ✅ ФИНАЛЬНЫЙ ЧЕК-ЛИСТ ПЕРЕД PRODUCTION

```
BEFORE PRODUCTION DEPLOYMENT:

Code Quality:
[ ] npm run lint - 0 errors
[ ] npm run type-check - 0 errors
[ ] npm run build - success
[ ] npm run test:e2e - all pass

Deployment:
[ ] Vercel аккаунт создан и connected
[ ] Environment variables setup на Vercel
[ ] Domain configured
[ ] SSL certificate active (auto)
[ ] GitHub repository public/private configured

Database:
[ ] Supabase backups enabled
[ ] RLS policies activated
[ ] Indexes created for large tables
[ ] Connection pooling configured

Monitoring:
[ ] Sentry integrated
[ ] Error tracking working
[ ] Performance monitoring active
[ ] Health check endpoint active

Security:
[ ] .env.local in .gitignore
[ ] No secrets in code
[ ] HTTPS enforced
[ ] CORS configured
[ ] Rate limiting active

Documentation:
[ ] README updated with deployment info
[ ] Architecture documented
[ ] API documented
[ ] Runbooks for common issues

Ready for Production: 🎉
```

---

## 📞 КОНТАКТЫ И ПОДДЕРЖКА

**Vercel Support**: https://vercel.com/support
**Supabase Support**: https://supabase.com/support
**Next.js Docs**: https://nextjs.org/docs
**Sentry Docs**: https://docs.sentry.io

---

**Подготовлено**: Tech Lead
**Дата**: 17 марта 2026
**Статус**: Готово к production после исправления ESLint ошибок

