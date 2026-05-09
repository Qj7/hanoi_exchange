"use client";

import { useTelegram } from "@/lib/telegram/TelegramProvider";
import {
  ExchangeIcon,
  HistoryIcon,
  ProfileIcon,
  ReviewsIcon,
} from "./icons";

export type TabKey = "exchange" | "profile" | "reviews" | "history";

interface BottomNavProps {
  active: TabKey;
  onChange: (tab: TabKey) => void;
}

const TABS: { key: TabKey; label: string; Icon: typeof ExchangeIcon }[] = [
  { key: "exchange", label: "Обмен", Icon: ExchangeIcon },
  { key: "profile", label: "Профиль", Icon: ProfileIcon },
  { key: "reviews", label: "Отзывы", Icon: ReviewsIcon },
  { key: "history", label: "История", Icon: HistoryIcon },
];

export function BottomNav({ active, onChange }: BottomNavProps) {
  const { haptic } = useTelegram();

  return (
    <nav className="sticky bottom-0 z-40 bg-[var(--bg)]/95 backdrop-blur-md border-t border-[var(--border)]">
      <div className="max-w-md mx-auto grid grid-cols-4">
        {TABS.map(({ key, label, Icon }) => {
          const isActive = active === key;
          return (
            <button
              key={key}
              type="button"
              onClick={() => {
                if (active !== key) {
                  haptic("light");
                  onChange(key);
                }
              }}
              className={`relative flex flex-col items-center justify-center gap-1 py-3 px-2 transition-colors ${
                isActive
                  ? "text-[var(--accent)]"
                  : "text-[var(--text-dim)] hover:text-[var(--text-muted)]"
              }`}
            >
              {isActive && (
                <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-[2px] bg-[var(--accent)] rounded-full" />
              )}
              <Icon className="w-5 h-5" />
              <span className="text-[10px] tracking-tight font-medium">
                {label}
              </span>
            </button>
          );
        })}
      </div>
      <div className="h-[env(safe-area-inset-bottom)]" />
    </nav>
  );
}
