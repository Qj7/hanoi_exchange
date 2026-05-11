# Hanoi Exchange — Telegram Mini App

Next.js + React приложение обменника для Telegram Mini App.

## Деплой на Vercel (основной)

1. Импортируй репозиторий в [Vercel](https://vercel.com/) (Framework Preset: **Next.js**).
2. В **Settings → Environment Variables** добавь те же переменные, что в `.env.example`:
   - `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` — из Supabase **Settings → API**.
   - `SUPABASE_URL` — обычно тот же URL, что и `NEXT_PUBLIC_SUPABASE_URL` (не публикуй service role в клиент).
   - `SUPABASE_SERVICE_ROLE_KEY` — только для сервера; нужен для `GET /api/supabase/health` и (если нет `DATABASE_URL`) для заявок и админки.
   - `DATABASE_URL` — опционально: прямое подключение к PostgreSQL (например Docker на машине разработчика). Если задано, заявки сохраняются **в этот Postgres вперёд Supabase**.
   - `TELEGRAM_BOT_TOKEN` — токен бота из BotFather; сервер им [проверяет](https://core.telegram.org/bots/webapps#validating-data-received-via-the-mini-app) `initData` при создании заявки и в истории.
   - `ADMIN_USERNAME`, `ADMIN_PASSWORD` — логин и пароль для `/admin` (только сервер; задай тестовые значения и смени в проде).
   - `ADMIN_SESSION_SECRET` — секрет ≥ 16 символов для подписи httpOnly-cookie админской сессии.
   - `NEXT_PUBLIC_MINI_APP_URL` — канонический URL Mini App (например `https://<проект>.vercel.app` или свой домен).
3. Сборка: **`next build`** (по умолчанию). **Не** выставляй `NEXT_OUTPUT=export` на Vercel — иначе сломается деплой с Route Handlers.

Минимальные HTTP-эндпоинты на том же домене, что и приложение:

- `GET /api/health`
- `GET /api/supabase/health` (проверка БД через service role)
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

## Локальный Postgres (Docker)

Заявки можно хранить без Supabase: PostgreSQL в контейнере и переменная `DATABASE_URL`.

1. Запусти контейнер: `npm run docker:up` (или `docker compose up -d`).
2. Примени миграцию таблицы заявок: `npm run db:migrate` (нужен запущенный Postgres из compose).
3. В `.env.local` добавь, например:
   `DATABASE_URL=postgresql://hanoi:hanoi_local@localhost:5432/hanoi_exchange`

Учётные данные и имя БД по умолчанию совпадают с `docker-compose.yml`. Если заданы и `DATABASE_URL`, и ключи Supabase, используется **локальный Postgres**.

На Windows при необходимости выполни SQL из `supabase/migrations/00002_exchange_orders.sql` через клиент `psql` или UI вручную.

## Supabase

1. Создай проект в [Supabase](https://supabase.com/), открой **Settings → API** и скопируй URL и ключи.
2. Выполни SQL из `supabase/migrations/` по порядку (`00001_init.sql`, затем `00002_exchange_orders.sql`) в **SQL Editor**.
3. Скопируй `.env.example` в `.env.local` и заполни переменные.

**Фронт (Mini App):** `src/lib/supabase/client.ts` — `createSupabaseBrowserClient()` для клиентских компонентов.

**Сервер Next (Vercel / `next dev`):** `src/lib/supabase/server.ts` — для Server Components и серверных вызовов с cookie-сессией Supabase.
