"use client";

import { useTelegram } from "@/lib/telegram/TelegramProvider";
import { Card } from "@/components/ui/Card";
import { CheckIcon, ShieldIcon } from "@/components/icons";

export function ProfilePage() {
  const { user, chatId } = useTelegram();
  if (!user) return null;

  const fullName = [user.first_name, user.last_name].filter(Boolean).join(" ");
  const initials = (
    (user.first_name?.[0] ?? "") + (user.last_name?.[0] ?? "")
  ).toUpperCase();

  return (
    <div className="px-4 pt-6 pb-6 space-y-3">
      <Card className="p-5 flex items-center gap-4">
        <Avatar url={user.photo_url} initials={initials} />
        <div className="min-w-0 flex-1">
          <div className="text-base font-semibold tracking-tight truncate">
            {fullName}
          </div>
          {user.username && (
            <div className="text-xs text-[var(--text-muted)] truncate">
              @{user.username}
            </div>
          )}
          <div className="mt-2 inline-flex items-center gap-1.5 text-[10px] uppercase tracking-[0.14em] px-2 py-0.5 rounded-md bg-[var(--accent-soft)] text-[var(--accent)] border border-[var(--accent)]/40">
            <ShieldIcon className="w-3 h-3" />
            Telegram-аккаунт
          </div>
        </div>
      </Card>

      <Card className="divide-y divide-[var(--border)]">
        <Row label="Telegram ID" value={chatId ? String(chatId) : "—"} mono />
        <Row label="Имя" value={user.first_name ?? "—"} />
        {user.last_name && <Row label="Фамилия" value={user.last_name} />}
        {user.username && <Row label="Username" value={`@${user.username}`} />}
        <Row label="Язык" value={user.language_code?.toUpperCase() ?? "—"} />
        <Row
          label="Premium"
          value={user.is_premium ? "Да" : "Нет"}
        />
      </Card>

      <Card className="p-5 space-y-3">
        <SectionTitle>Статус клиента</SectionTitle>
        <Stat
          label="Совершено сделок"
          value="0"
          hint="Первая сделка открывает дополнительные способы получения"
        />
        <Stat label="Общий объём" value="0 USD" />
        <Stat label="Лимит на одну сделку" value="3 000 USD" />
      </Card>

      <Card className="p-5 space-y-3">
        <SectionTitle>Документы и согласия</SectionTitle>
        <DocRow label="Условия обслуживания" />
        <DocRow label="Политика конфиденциальности" />
        <DocRow label="AML / KYC политика" />
      </Card>
    </div>
  );
}

function Avatar({ url, initials }: { url?: string; initials: string }) {
  if (url) {
    // eslint-disable-next-line @next/next/no-img-element
    return (
      <img
        src={url}
        alt=""
        className="w-14 h-14 rounded-full object-cover border border-[var(--border-strong)]"
      />
    );
  }
  return (
    <div className="w-14 h-14 rounded-full bg-[var(--bg-elevated-2)] border border-[var(--border-strong)] flex items-center justify-center text-sm font-semibold text-[var(--accent)]">
      {initials || "·"}
    </div>
  );
}

function Row({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="flex items-center justify-between px-5 py-3">
      <span className="text-xs text-[var(--text-muted)]">{label}</span>
      <span
        className={`text-sm text-[var(--text)] ${
          mono ? "font-mono text-xs" : ""
        }`}
      >
        {value}
      </span>
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-[11px] uppercase tracking-[0.14em] text-[var(--text-dim)] font-medium">
      {children}
    </div>
  );
}

function Stat({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div>
      <div className="flex items-baseline justify-between">
        <span className="text-sm text-[var(--text-muted)]">{label}</span>
        <span className="text-sm font-medium font-mono">{value}</span>
      </div>
      {hint && (
        <p className="text-[11px] text-[var(--text-dim)] mt-0.5">{hint}</p>
      )}
    </div>
  );
}

function DocRow({ label }: { label: string }) {
  return (
    <button
      type="button"
      className="w-full flex items-center justify-between px-3 -mx-3 py-2 rounded-md hover:bg-[var(--bg-elevated-2)] transition-colors"
    >
      <span className="text-sm text-[var(--text)]">{label}</span>
      <CheckIcon className="w-4 h-4 text-[var(--success)]" />
    </button>
  );
}
