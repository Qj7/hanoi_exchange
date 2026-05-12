"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

type Props = {
  /** Интервал опроса списка заявок (мс). По умолчанию 5 с. */
  intervalMs?: number;
};

export function AdminOrdersAutoRefresh({ intervalMs = 5000 }: Props) {
  const router = useRouter();

  useEffect(() => {
    const tick = () => {
      if (typeof document !== "undefined" && document.visibilityState === "hidden") {
        return;
      }
      router.refresh();
    };

    const id = setInterval(tick, intervalMs);
    const onVisible = () => tick();
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      clearInterval(id);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [router, intervalMs]);

  return null;
}
