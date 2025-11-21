# Настройка переменных окружения на Render

## Проблема с изображениями

Если изображения не загружаются на production, убедитесь, что переменные окружения настроены правильно.

## API Backend (apps/api)

### Обязательные переменные

В настройках вашего API сервиса на Render добавьте:

```bash
# Автоматически предоставляется Render (не нужно добавлять вручную)
RENDER_EXTERNAL_URL=https://aimak-api-xxxx.onrender.com

# Добавьте вручную - URL вашего API (тот же что и RENDER_EXTERNAL_URL)
APP_URL=https://aimak-api-xxxx.onrender.com
```

**Важно**: Замените `aimak-api-xxxx` на реальный URL вашего API сервиса.

### Как получить правильный URL:

1. Откройте ваш API сервис на Render
2. Скопируйте URL из раздела "Service URL" (например: `https://aimak-api-w8ps.onrender.com`)
3. Добавьте переменную `APP_URL` с этим значением в "Environment" настройках

### Другие необходимые переменные:

```bash
DATABASE_URL=postgresql://...
JWT_SECRET=your-secret-key
FRONTEND_URL=https://aimak-web-rvep.onrender.com
CORS_ORIGIN=https://aimak-web-rvep.onrender.com
```

## Frontend (apps/web)

### Обязательные переменные

```bash
# URL вашего API
NEXT_PUBLIC_API_URL=https://aimak-api-xxxx.onrender.com/api

# Для server-side запросов
API_URL=https://aimak-api-xxxx.onrender.com/api
```

## Проверка

После добавления переменных:

1. Перезапустите оба сервиса на Render
2. Загрузите новое изображение через админку
3. Проверьте URL изображения в базе данных - он должен быть полным: `https://aimak-api-xxxx.onrender.com/uploads/filename.jpg`
4. Изображение должно загружаться корректно на фронтенде

## Отладка

Если проблемы остались, проверьте логи API:

```bash
# В логах должно быть:
[MediaService] Original URL from env: https://aimak-api-xxxx.onrender.com
[MediaService] Final image URL: https://aimak-api-xxxx.onrender.com/uploads/filename.jpg
```

Если в логах `http://localhost:4000` - переменная `APP_URL` не установлена или установлена неправильно.
