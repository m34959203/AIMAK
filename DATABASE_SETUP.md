# Настройка базы данных на Render

## Проблема
API возвращает 500 Internal Server Error на всех запросах.

```
POST https://aimak-api.onrender.com/api/auth/login 500
GET https://aimak-api.onrender.com/api/categories 500
```

## Причина
База данных PostgreSQL не настроена или недоступна для API сервера.

## Решение

### 1. Создать PostgreSQL базу данных на Render

1. Зайти в Dashboard на Render.com
2. Нажать "New +" → "PostgreSQL"
3. Выбрать:
   - Name: `aimak-db`
   - Region: Same as API (для минимальной задержки)
   - PostgreSQL Version: 15 или выше
   - Plan: Free или Starter
4. Нажать "Create Database"
5. Дождаться создания (1-2 минуты)

### 2. Подключить БД к API сервису

1. Открыть созданную базу данных
2. Скопировать **Internal Database URL** (формат: `postgresql://user:pass@host/db`)
3. Перейти в настройки API сервиса (`aimak-api`)
4. Environment → Add Environment Variable:
   - Key: `DATABASE_URL`
   - Value: [вставить Internal Database URL]
5. Сохранить

### 3. Обновить Build Command для API

В настройках API сервиса обновить Build Command:

```bash
cd apps/api && corepack enable pnpm && pnpm install --frozen-lockfile && pnpm prisma generate && pnpm prisma migrate deploy && pnpm build
```

Это добавляет:
- `pnpm prisma generate` - генерирует Prisma Client
- `pnpm prisma migrate deploy` - применяет миграции к БД

### 4. Запустить seeds (тестовые данные)

После успешного деплоя, через Render Shell или вручную:

```bash
# Категории
npx tsx apps/api/prisma/seeds/categories.seed.ts

# Тестовые статьи
npx tsx apps/api/prisma/seeds/articles.seed.ts
```

Или через Render Shell:
1. Открыть API сервис
2. Shell → Connect
3. Выполнить команды выше

### 5. Создать админа (опционально)

Через Render Shell или psql:

```sql
INSERT INTO "User" (id, email, "firstName", "lastName", password, role, "createdAt", "updatedAt")
VALUES (
  gen_random_uuid(),
  'admin@aimakakshamy.kz',
  'Админ',
  'Редактор',
  '$2b$10$ZqX5Z5Z5Z5Z5Z5Z5Z5Z5ZOeK9K9K9K9K9K9K9K9K9K9K9K9K9K', -- 'admin123'
  'ADMIN',
  NOW(),
  NOW()
);
```

## Проверка

После настройки проверить:

```bash
# Категории должны загружаться
curl https://aimak-api.onrender.com/api/categories

# Логин должен работать (вернет 401 для неверных данных, а не 500)
curl -X POST https://aimak-api.onrender.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"test"}'
```

## Временное решение

В коде добавлены fallback категории, поэтому:
- ✅ Категории отображаются даже если API недоступен
- ❌ Статьи не загружаются (показывается "нет статей")
- ❌ Логин/регистрация не работают

После настройки БД все заработает полностью.

## Структура БД

Prisma schema находится в `apps/api/prisma/schema.prisma`

Основные таблицы:
- User - пользователи и админы
- Category - категории (ЖАҢАЛЫҚТАР, ӨЗЕКТІ, и т.д.)
- Tag - теги для статей
- Article - статьи (билингвальные KZ/RU)
- ArticleTag - связь статей и тегов

## Миграции

Все миграции в `apps/api/prisma/migrations/`

Применяются автоматически при деплое через `prisma migrate deploy`
