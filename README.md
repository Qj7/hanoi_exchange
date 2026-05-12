# Hanoi Exchange — Telegram Mini App

Next.js + React приложение обменника для Telegram Mini App.

**Пошаговая настройка Supabase + Vercel + Telegram + переменные:** см. **[DEPLOY.md](./DEPLOY.md)**.

## Деплой на Vercel (основной)

1. Импортируй репозиторий в [Vercel](https://vercel.com/) (Framework Preset: **Next.js**).
2. В **Settings → Environment Variables** добавь переменные из **DEPLOY.md** (раздел 3), в частности:
   - `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SECRET_KEY` — Supabase **Settings → API Keys**.
   - `TELEGRAM_BOT_TOKEN` — токен бота из BotFather; сервер им [проверяет](https://core.telegram.org/bots/webapps#validating-data-received-via-the-mini-app) `initData` при создании заявки и в истории.
   - `ADMIN_USERNAME`, `ADMIN_PASSWORD`, `ADMIN_SESSION_SECRET` (≥16), `NEXT_PUBLIC_MINI_APP_URL`.
3. Сборка: **`next build`** (по умолчанию). **Не** выставляй `NEXT_OUTPUT=export` на Vercel — иначе сломается деплой с Route Handlers.

Минимальные HTTP-эндпоинты на том же домене, что и приложение:

- `GET /api/health`
- `GET /api/supabase/health` (проверка БД через `SUPABASE_SECRET_KEY`)
- `POST /api/orders` / `GET /api/orders` — заявки (заголовок `X-Telegram-Init-Data`, данные заявки валидируются на сервере)
- `POST /api/admin/login` / `POST /api/admin/logout` — вход в админку
- Веб-интерфейс: `/admin` (после логина), `/admin/login`

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

1. Проект в [Supabase](https://supabase.com/), **Settings → API Keys** — URL, publishable, secret (см. **DEPLOY.md**).
2. Миграции: **SQL Editor** по файлам `supabase/migrations/00001_init.sql`, `00002_exchange_orders.sql`, либо **`npm run db:supabase:push`** после `supabase link`.
3. Переменные в `.env.local` (локально) и на Vercel — см. **DEPLOY.md**.

**Клиент:** `src/lib/supabase/client.ts` — `createSupabaseBrowserClient()`.

**Сервер (cookie-сессия Supabase):** `src/lib/supabase/server.ts`.
