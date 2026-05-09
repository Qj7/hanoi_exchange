"use client";

import { useState } from "react";
import { useTelegram } from "@/lib/telegram/TelegramProvider";
import { WelcomeScreen } from "./WelcomeScreen";
import { BottomNav, type TabKey } from "./BottomNav";
import { ExchangePage } from "./pages/ExchangePage";
import { ProfilePage } from "./pages/ProfilePage";
import { ReviewsPage } from "./pages/ReviewsPage";
import { HistoryPage } from "./pages/HistoryPage";
import { Logo } from "./Logo";
import { ChevronDownIcon } from "./icons";

const TAB_TITLE: Record<TabKey, string> = {
  exchange: "Обмен валют",
  profile: "Профиль",
  reviews: "Отзывы",
  history: "История",
};

export function AppShell() {
  const { status, user } = useTelegram();
  const [tab, setTab] = useState<TabKey>("exchange");

  if (status === "loading") {
    return <Splash />;
  }

  if (status === "outside" || !user) {
    return <WelcomeScreen />;
  }

  return (
    <div className="min-h-screen flex flex-col max-w-md mx-auto w-full">
      <header className="sticky top-0 z-30 bg-[var(--bg)]/95 backdrop-blur-md border-b border-[var(--border)] px-4 py-3 flex items-center justify-between">
        <Logo size="sm" />
        <div className="text-[10px] uppercase tracking-[0.18em] text-[var(--text-dim)]">
          {TAB_TITLE[tab]}
        </div>
      </header>

      <main className="flex-1">
        {tab === "exchange" && <ExchangePage />}
        {tab === "profile" && <ProfilePage />}
        {tab === "reviews" && <ReviewsPage />}
        {tab === "history" && <HistoryPage />}
      </main>

      <BottomNav active={tab} onChange={setTab} />
    </div>
  );
}

function Splash() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4">
      <Logo size="md" />
      <ChevronDownIcon className="w-4 h-4 text-[var(--text-dim)] animate-pulse" />
      <div className="text-[11px] uppercase tracking-[0.18em] text-[var(--text-dim)]">
        Подключение к Telegram
      </div>
    </div>
  );
}
