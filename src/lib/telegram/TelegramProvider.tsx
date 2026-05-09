"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { TelegramUser, TelegramWebApp } from "./types";

type TelegramStatus = "loading" | "ready" | "outside";

interface TelegramContextValue {
  status: TelegramStatus;
  user: TelegramUser | null;
  chatId: number | null;
  webApp: TelegramWebApp | null;
  initData: string;
  haptic: (style?: "light" | "medium" | "heavy" | "soft" | "rigid") => void;
}

const TelegramContext = createContext<TelegramContextValue>({
  status: "loading",
  user: null,
  chatId: null,
  webApp: null,
  initData: "",
  haptic: () => {},
});

const READY_TIMEOUT_MS = 1500;

export function TelegramProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<TelegramStatus>("loading");
  const [webApp, setWebApp] = useState<TelegramWebApp | null>(null);
  const [user, setUser] = useState<TelegramUser | null>(null);
  const [initData, setInitData] = useState<string>("");

  useEffect(() => {
    if (typeof window === "undefined") return;

    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    let attemptId: ReturnType<typeof setInterval> | null = null;

    const init = (wa: TelegramWebApp) => {
      try {
        wa.ready();
        wa.expand();
        wa.setHeaderColor("#0a0f1c");
        wa.setBackgroundColor("#0a0f1c");
      } catch {
        // older Telegram clients may not support every method
      }

      setWebApp(wa);
      setInitData(wa.initData ?? "");

      const tgUser = wa.initDataUnsafe?.user ?? null;
      if (tgUser?.id) {
        setUser(tgUser);
        setStatus("ready");
      } else {
        setStatus("outside");
      }
    };

    const tryAttach = () => {
      const wa = window.Telegram?.WebApp;
      if (wa && (wa.initData || wa.initDataUnsafe)) {
        if (attemptId) clearInterval(attemptId);
        if (timeoutId) clearTimeout(timeoutId);
        init(wa);
        return true;
      }
      return false;
    };

    if (!tryAttach()) {
      attemptId = setInterval(tryAttach, 100);
      timeoutId = setTimeout(() => {
        if (attemptId) clearInterval(attemptId);
        const wa = window.Telegram?.WebApp;
        if (wa) {
          init(wa);
        } else {
          setStatus("outside");
        }
      }, READY_TIMEOUT_MS);
    }

    return () => {
      if (attemptId) clearInterval(attemptId);
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, []);

  const haptic = useCallback(
    (style: "light" | "medium" | "heavy" | "soft" | "rigid" = "light") => {
      try {
        webApp?.HapticFeedback?.impactOccurred(style);
      } catch {
        // noop
      }
    },
    [webApp]
  );

  const value = useMemo<TelegramContextValue>(
    () => ({
      status,
      user,
      chatId: user?.id ?? null,
      webApp,
      initData,
      haptic,
    }),
    [status, user, webApp, initData, haptic]
  );

  return (
    <TelegramContext.Provider value={value}>
      {children}
    </TelegramContext.Provider>
  );
}

export function useTelegram() {
  return useContext(TelegramContext);
}
