"use client";

import { useCallback, useEffect, useState } from "react";
import type { CurrencyCode } from "./data";

const REFRESH_MS = 60_000;

export function useExchangeRates(
  from: CurrencyCode,
  to: CurrencyCode,
  giveAmount?: number
) {
  const [rate, setRate] = useState<number | null>(null);
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (from === to) {
      setRate(1);
      setUpdatedAt(null);
      setError(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const params = new URLSearchParams({ from, to });
      if (giveAmount != null && giveAmount > 0) {
        params.set("amount", String(giveAmount));
      }
      const res = await fetch(`/api/rates?${params}`);
      const json = (await res.json().catch(() => ({}))) as {
        rate?: number;
        updatedAt?: string;
        error?: string;
      };
      if (!res.ok) {
        throw new Error(json.error ?? "Не удалось загрузить курсы");
      }
      if (typeof json.rate !== "number" || !Number.isFinite(json.rate)) {
        throw new Error("Пустой ответ курсов");
      }
      setRate(json.rate);
      setUpdatedAt(json.updatedAt ?? null);
      setError(null);
    } catch (e) {
      setRate(null);
      setError(e instanceof Error ? e.message : "Ошибка загрузки курсов");
    } finally {
      setLoading(false);
    }
  }, [from, to, giveAmount]);

  useEffect(() => {
    void load();
    const id = setInterval(() => void load(), REFRESH_MS);
    return () => clearInterval(id);
  }, [load]);

  return { rate, updatedAt, loading, error, refresh: load };
}
