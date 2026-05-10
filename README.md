# Hanoi Exchange — Telegram Mini App

Next.js + React приложение обменника для Telegram Mini App.

## Деплой на Vercel (основной)

1. Импортируй репозиторий в [Vercel](https://vercel.com/) (Framework Preset: **Next.js**).
2. В **Settings → Environment Variables** добавь те же переменные, что в `.env.example`:
   - `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` — из Supabase **Settings → API**.
   - `SUPABASE_URL` — обычно тот же URL, что и `NEXT_PUBLIC_SUPABASE_URL` (не публикуй service role в клиент).
   - `SUPABASE_SERVICE_ROLE_KEY` — только для сервера; нужен для `GET /api/supabase/health`.
   - `NEXT_PUBLIC_MINI_APP_URL` — канонический URL Mini App (например `https://<проект>.vercel.app` или свой домен).
3. Сборка: **`next build`** (по умолчанию). **Не** выставляй `NEXT_OUTPUT=export` на Vercel — иначе сломается деплой с Route Handlers.

Минимальные HTTP-эндпоинты на том же домене, что и приложение:

- `GET /api/health`
- `GET /api/supabase/health` (проверка БД через service role)

Локально отдельный процесс (`npm run dev:backend`) опционален; на Vercel достаточно этих маршрутов.

## Локально

```bash
npm install
npm run dev
```

Обычный браузер покажет экран «откройте через Telegram». Внутри Telegram приложение читает пользователя из `window.Telegram.WebApp`.

Опционально второй терминал — локальный Hono API на порту **8787** (тот же контракт, что и `/api/*` на Vercel):

```bash
npm run dev:backend
```

## GitHub Pages

Раньше проект собирался как статический экспорт в `out/`. С появлением **`src/app/api`** статический экспорт (`NEXT_OUTPUT=export`) с Next.js **несовместим**, поэтому автоматический деплой на Pages отключён. Для продакшена используй **Vercel** (см. выше).

## Telegram

В BotFather / настройках бота укажи URL Mini App (после деплоя на Vercel — свой продакшен-URL):

```text
https://<твой-домен>/
```

Приложение проверяет, что запущено внутри Telegram, и берёт `chat_id` так:

```ts
window.Telegram.WebApp.initDataUnsafe.user.id
```

Если `user.id` есть — пользователь считается авторизованным в Mini App. Если нет — показывается экран входа через Telegram.

## Supabase

1. Создай проект в [Supabase](https://supabase.com/), открой **Settings → API** и скопируй URL и ключи.
2. Выполни SQL из `supabase/migrations/00001_init.sql` в **SQL Editor** (таблица `app_config` + политика чтения для проверки связи).
3. Скопируй `.env.example` в `.env.local` и заполни переменные.

**Фронт (Mini App):** `src/lib/supabase/client.ts` — `createSupabaseBrowserClient()` для клиентских компонентов.

**Сервер Next (Vercel / `next dev`):** `src/lib/supabase/server.ts` — для Server Components и серверных вызовов с cookie-сессией Supabase.
