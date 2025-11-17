# 🎨 Миграция на дизайн Tengrinews

## ✅ Выполненные работы

### 1. Обновление базы данных (Prisma Schema)

Обновлена schema для полной поддержки двуязычности (KZ/RU) согласно ТД:

**Добавлено:**
- ✅ Двуязычные поля для статей (`titleKz`/`titleRu`, `contentKz`/`contentRu` и т.д.)
- ✅ Двуязычные поля для категорий (`nameKz`/`nameRu`, `descriptionKz`/`descriptionRu`)
- ✅ Двуязычные поля для тегов (`nameKz`/`nameRu`)
- ✅ Модель `ArticleStatus` (DRAFT, REVIEW, SCHEDULED, PUBLISHED, ARCHIVED)
- ✅ Модель `MediaFile` для управления медиафайлами
- ✅ Модель `Comment` для системы комментариев
- ✅ Модель `AdUnit` для рекламной системы (AdPosition, AdSize)
- ✅ Модель `AIGeneration` для отслеживания AI операций
- ✅ Дополнительные поля: `isBreaking`, `isFeatured`, `isPinned`, `allowComments`
- ✅ Метрики: `views`, `likes`, `shares`
- ✅ AI поля: `aiGenerated`, `aiProvider`
- ✅ Иерархия категорий (parent-child)

**Файл:** `apps/api/prisma/schema.prisma`

### 2. Новые компоненты в стиле Tengrinews

#### 2.1 TengriHeader (`tengri-header.tsx`)

**Особенности:**
- ✅ Верхняя панель с погодой, курсом валют, телефоном
- ✅ Переключатель языков КАЗ/РУС
- ✅ Главное меню с категориями
- ✅ Навигация по разделам (черная полоса внизу)
- ✅ Адаптивное мобильное меню
- ✅ Зеленые акценты (#03ab02)
- ✅ Sticky header (фиксированный)
- ✅ Интеграция с системой авторизации

**Категории из ТД:**
- ЖАҢАЛЫҚТАР / НОВОСТИ
- ӨЗЕКТІ / АКТУАЛЬНО
- САЯСАТ / ПОЛИТИКА
- МӘДЕНИЕТ / КУЛЬТУРА
- ҚОҒАМ / ОБЩЕСТВО
- KAZAKHMYS NEWS

#### 2.2 TengriFooter (`tengri-footer.tsx`)

**Особенности:**
- ✅ 4-колоночный layout
- ✅ Блок "О нас" с контактами редакции и рекламного отдела
- ✅ Карта сайта с категориями
- ✅ Ссылки компании (О нас, Контакты, Реклама, Вакансии)
- ✅ 8 социальных сетей (Instagram, Telegram, VK, Facebook, Twitter, YouTube, TikTok, WhatsApp)
- ✅ Блок мобильных приложений (App Store, Google Play, Huawei)
- ✅ Нижняя панель с copyright и ссылками на политику
- ✅ Двуязычность

#### 2.3 TengriArticleCard (`tengri-article-card.tsx`)

**Варианты отображения:**
- ✅ **Hero** - большая карточка с градиентом (500px высота)
- ✅ **Vertical** - вертикальная карточка с изображением сверху
- ✅ **Horizontal** - горизонтальная карточка (стиль Tengrinews)

**Особенности:**
- ✅ Цветные теги категорий (синий, красный, фиолетовый и т.д.)
- ✅ Бейдж "СРОЧНО" для `isBreaking`
- ✅ Отображение времени публикации
- ✅ Счетчик просмотров
- ✅ Hover эффекты (масштабирование изображения, изменение цвета)
- ✅ Двуязычность

## 📋 Дальнейшие шаги

### 1. Миграция базы данных

```bash
cd apps/api
npx prisma migrate dev --name tengri_migration
npx prisma generate
```

**⚠️ ВАЖНО:** Это создаст новые таблицы и изменит существующие. Создайте бэкап БД перед миграцией!

### 2. Обновление существующих API endpoints

Необходимо обновить следующие сервисы для работы с новыми полями:

- `apps/api/src/articles/articles.service.ts`
- `apps/api/src/categories/categories.service.ts`
- `apps/api/src/tags/tags.service.ts`

**Пример обновления:**

```typescript
// Было
async create(dto: CreateArticleDto) {
  return this.prisma.article.create({
    data: {
      title: dto.title,
      content: dto.content,
      // ...
    }
  });
}

// Стало
async create(dto: CreateArticleDto) {
  return this.prisma.article.create({
    data: {
      titleKz: dto.titleKz,
      titleRu: dto.titleRu,
      contentKz: dto.contentKz,
      contentRu: dto.contentRu,
      slugKz: this.generateSlug(dto.titleKz),
      slugRu: dto.titleRu ? this.generateSlug(dto.titleRu) : null,
      // ...
    }
  });
}
```

### 3. Создание маршрутизации с языками

Создать структуру:

```
apps/web/src/app/
├── [lang]/
│   ├── layout.tsx
│   ├── page.tsx
│   ├── zhanalyqtar/
│   │   └── page.tsx
│   ├── ozekti/
│   │   └── page.tsx
│   ├── [category]/
│   │   └── [slug]/
│   │       └── page.tsx
│   └── ...
```

**Пример `apps/web/src/app/[lang]/layout.tsx`:**

```typescript
import { TengriHeader } from '@/components/tengri-header';
import { TengriFooter } from '@/components/tengri-footer';

export default function LangLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { lang: 'kz' | 'ru' };
}) {
  return (
    <>
      <TengriHeader lang={params.lang} />
      <main className="min-h-screen bg-gray-50">
        {children}
      </main>
      <TengriFooter lang={params.lang} />
    </>
  );
}
```

### 4. Обновление главной страницы

**Файл:** `apps/web/src/app/[lang]/page.tsx`

```typescript
import { TengriArticleCard } from '@/components/tengri-article-card';

export default async function HomePage({
  params: { lang }
}: {
  params: { lang: 'kz' | 'ru' }
}) {
  const articles = await getArticles({ lang, limit: 20 });

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Hero article */}
        <div className="lg:col-span-8">
          <TengriArticleCard
            article={articles[0]}
            lang={lang}
            variant="hero"
          />
        </div>

        {/* Sidebar */}
        <aside className="lg:col-span-4">
          <div className="bg-white rounded-lg p-4 mb-6">
            <h3 className="font-bold mb-4">Популярное</h3>
            {articles.slice(1, 6).map(article => (
              <TengriArticleCard
                key={article.id}
                article={article}
                lang={lang}
                variant="horizontal"
              />
            ))}
          </div>
        </aside>

        {/* Main content */}
        <div className="lg:col-span-8">
          <h2 className="text-2xl font-bold mb-6">Последние новости</h2>
          <div className="space-y-4">
            {articles.slice(6).map(article => (
              <TengriArticleCard
                key={article.id}
                article={article}
                lang={lang}
                variant="horizontal"
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
```

### 5. Обновление админ-панели

Добавить поля для двуязычного контента:

```typescript
// apps/web/src/app/admin/articles/new/page.tsx
<form>
  <Tabs defaultValue="kz">
    <TabsList>
      <TabsTrigger value="kz">🇰🇿 Қазақша</TabsTrigger>
      <TabsTrigger value="ru">🇷🇺 Русский</TabsTrigger>
    </TabsList>

    <TabsContent value="kz">
      <Input label="Тақырып (KZ)" name="titleKz" />
      <Textarea label="Мазмұны (KZ)" name="contentKz" />
    </TabsContent>

    <TabsContent value="ru">
      <Input label="Заголовок (RU)" name="titleRu" />
      <Textarea label="Содержание (RU)" name="contentRu" />
    </TabsContent>
  </Tabs>

  {/* Дополнительные поля */}
  <Checkbox label="Срочная новость" name="isBreaking" />
  <Checkbox label="Избранное" name="isFeatured" />
  <Checkbox label="Закреплено" name="isPinned" />
  <Checkbox label="Разрешить комментарии" name="allowComments" />
</form>
```

### 6. Добавление недостающих функций из ТД

**Приоритет 1 (HIGH):**
- [ ] Система комментариев (использовать модель `Comment`)
- [ ] Рекламные блоки (использовать модель `AdUnit`)
- [ ] Полнотекстовый поиск (Elasticsearch или pg_trgm)
- [ ] Пагинация для всех списков

**Приоритет 2 (MEDIUM):**
- [ ] AI генерация контента (интеграция Gemini/GPT-4)
- [ ] Автоперевод KZ↔RU
- [ ] Email уведомления
- [ ] Push уведомления

**Приоритет 3 (LOW):**
- [ ] PWA (manifest.json, service worker)
- [ ] Темная тема
- [ ] RSS feed
- [ ] Sitemap.xml
- [ ] Google Analytics / Yandex Metrika

## 🎨 Дизайн-система Tengrinews

### Цвета

```css
/* Основные */
--tengri-green: #03ab02;
--tengri-dark: #1a1a1a;
--tengri-gray: #f5f5f5;

/* Категории */
--cat-news: #3b82f6;      /* Синий */
--cat-urgent: #ef4444;    /* Красный */
--cat-politics: #a855f7;  /* Фиолетовый */
--cat-culture: #ec4899;   /* Розовый */
--cat-society: #10b981;   /* Зеленый */
--cat-business: #f97316;  /* Оранжевый */
```

### Типография

```css
/* Шрифт */
font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;

/* Заголовки */
h1: 2.5rem / 40px, font-weight: 700
h2: 2rem / 32px, font-weight: 700
h3: 1.5rem / 24px, font-weight: 600

/* Текст */
body: 1rem / 16px, font-weight: 400
small: 0.875rem / 14px
```

### Компоненты

- **Header:** sticky, bg-white, border-bottom
- **Category tag:** uppercase, bold, colored background, white text, rounded
- **Card hover:** scale-105 на изображении, color transition на заголовке
- **Footer:** bg-gray-900, text-gray-300, 4-column grid

## 📝 Checklist

- [x] Обновить Prisma schema
- [x] Создать TengriHeader компонент
- [x] Создать TengriFooter компонент
- [x] Создать TengriArticleCard компонент
- [ ] Создать миграцию БД
- [ ] Обновить API endpoints
- [ ] Создать структуру маршрутизации [lang]
- [ ] Обновить главную страницу
- [ ] Обновить админ-панель для двуязычности
- [ ] Добавить систему комментариев
- [ ] Добавить рекламные блоки
- [ ] Интегрировать AI генерацию

## 🚀 Запуск

После применения всех изменений:

```bash
# 1. Миграция БД
cd apps/api
npx prisma migrate dev --name tengri_migration
npx prisma generate

# 2. Перезапуск приложения
cd ../..
docker-compose down
docker-compose up -d

# 3. Проверка
# Фронтенд: http://localhost:3000/kz
# API: http://localhost:4000/api/docs
```

## 📚 Ресурсы

- [Tengrinews.kz](https://tengrinews.kz/) - референс дизайна
- [ТД проекта](./TD.md) - техническая документация
- [Prisma Docs](https://www.prisma.io/docs) - документация ORM
- [Next.js i18n](https://nextjs.org/docs/app/building-your-application/routing/internationalization) - многоязычность

---

**Автор:** Claude AI
**Дата:** 2025-11-17
**Версия:** 1.0.0
