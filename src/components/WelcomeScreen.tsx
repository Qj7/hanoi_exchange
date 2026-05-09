"use client";

import { Logo } from "./Logo";
import { TelegramIcon, ShieldIcon, ClockIcon, CheckIcon } from "./icons";

const TELEGRAM_BOT_URL =
  process.env.NEXT_PUBLIC_TELEGRAM_BOT_URL ?? "https://t.me/HanoiExchangeBot";

export function WelcomeScreen() {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="px-6 pt-8">
        <Logo size="md" showSubtitle />
      </header>

      <main className="flex-1 flex flex-col items-center justify-center px-6 py-10">
        <div className="w-full max-w-sm flex flex-col items-center text-center animate-fade-in-up">
          <div className="relative mb-7">
            <div className="absolute inset-0 blur-2xl bg-[var(--accent)] opacity-20 rounded-full" />
            <div className="relative w-20 h-20 rounded-2xl bg-[var(--bg-elevated)] border border-[var(--border-strong)] flex items-center justify-center">
              <TelegramIcon className="w-9 h-9 text-[var(--accent)]" />
            </div>
          </div>

          <h1 className="text-2xl font-semibold tracking-tight mb-2">
            Вход через Telegram
          </h1>
          <p className="text-sm text-[var(--text-muted)] leading-relaxed mb-8">
            Это приложение работает только внутри Telegram.
            <br />
            Откройте бота, чтобы получить доступ к обмену.
          </p>

          <a
            href={TELEGRAM_BOT_URL}
            target="_blank"
            rel="noreferrer"
            className="w-full flex items-center justify-center gap-2 h-12 rounded-lg bg-[var(--accent)] text-[#11151f] font-medium tracking-tight transition-colors hover:bg-[var(--accent-hover)]"
          >
            <TelegramIcon className="w-5 h-5" />
            Открыть в Telegram
          </a>

          <div className="mt-10 w-full grid gap-3 text-left">
            <FeatureRow
              icon={<ShieldIcon className="w-4 h-4" />}
              title="Безопасные сделки"
              description="Идентификация по Telegram-аккаунту"
            />
            <FeatureRow
              icon={<ClockIcon className="w-4 h-4" />}
              title="Курс в реальном времени"
              description="Обновление котировок каждую минуту"
            />
            <FeatureRow
              icon={<CheckIcon className="w-4 h-4" />}
              title="Подтверждение оператором"
              description="Каждая заявка проверяется менеджером"
            />
          </div>
        </div>
      </main>

      <footer className="px-6 pb-8 text-center text-[11px] text-[var(--text-dim)]">
        Hanoi Exchange — лицензированный обмен валют. © {new Date().getFullYear()}
      </footer>
    </div>
  );
}

function FeatureRow({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="flex items-start gap-3 px-4 py-3 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border)]">
      <div className="w-8 h-8 rounded-md bg-[var(--accent-soft)] text-[var(--accent)] flex items-center justify-center flex-shrink-0">
        {icon}
      </div>
      <div className="min-w-0">
        <div className="text-sm font-medium text-[var(--text)]">{title}</div>
        <div className="text-xs text-[var(--text-muted)] mt-0.5">
          {description}
        </div>
      </div>
    </div>
  );
}
