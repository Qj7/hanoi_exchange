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
  /** Telegram user id — same as `chat_id` for private chats with the bot. */
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

const HEADER_BG = "#0a0f1c";

/**
 * Telegram WebApp version comparator.
 * Returns true if `current >= required`.
 */
function versionAtLeast(current: string | undefined, required: string): boolean {
  if (!current) return false;
  const a = current.split(".").map(Number);
  const b = required.split(".").map(Number);
  const len = Math.max(a.length, b.length);
  for (let i = 0; i < len; i++) {
    const x = a[i] ?? 0;
    const y = b[i] ?? 0;
    if (x > y) return true;
    if (x < y) return false;
  }
  return true;
}

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
      // 1. Tell Telegram the WebView is rendered (hides the loading bar).
      try {
        wa.ready();
      } catch {
        // ignore
      }

      // 2. Expand to full available height — most Mini Apps want this.
      try {
        wa.expand();
      } catch {
        // ignore
      }

      // 3. Match the host chrome to our brand. setHeaderColor only works
      //    with hex strings since Bot API 6.9.
      if (versionAtLeast(wa.version, "6.9")) {
        try {
          wa.setHeaderColor(HEADER_BG);
        } catch {
          // ignore
        }
      }
      if (versionAtLeast(wa.version, "6.1")) {
        try {
          wa.setBackgroundColor(HEADER_BG);
        } catch {
          // ignore
        }
      }

      // 4. Disable swipe-to-close — otherwise scrolling up at the top of
      //    a long page accidentally minimises the Mini App. (Bot API 7.7+)
      if (versionAtLeast(wa.version, "7.7")) {
        try {
          wa.disableVerticalSwipes?.();
        } catch {
          // ignore
        }
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
