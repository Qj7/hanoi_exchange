# Hanoi Exchange — Telegram Mini App

Next.js + React приложение обменника для Telegram Mini App. Проект готов к деплою на GitHub Pages.

## Локально

```bash
npm install
npm run dev
```

Обычный браузер покажет экран «откройте через Telegram». Внутри Telegram приложение читает пользователя из `window.Telegram.WebApp`.

## GitHub Pages

Деплой запускается автоматически на push в `main`:

```bash
git push origin main
```

Workflow `.github/workflows/deploy.yml` собирает статический экспорт Next.js в `out/` и публикует его в GitHub Pages.

## Telegram

В BotFather / настройках бота укажи URL Mini App:

```text
https://qj7.github.io/hanoi_exchange/
```

Приложение проверяет, что запущено внутри Telegram, и берёт `chat_id` так:

```ts
window.Telegram.WebApp.initDataUnsafe.user.id
```

Если `user.id` есть — пользователь считается авторизованным в Mini App. Если нет — показывается экран входа через Telegram.
