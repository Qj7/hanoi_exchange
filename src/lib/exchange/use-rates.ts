"use client";

import { useCallback, useEffect, useState } from "react";
import type { CurrencyCode } from "./data";

const REFRESH_MS = 60_000;
/** Запит курсу з сумою — лише після паузи в наборі (менше навантаження на API). */
const GIVE_AMOUNT_DEBOUNCE_MS = 400;

export function useExchangeRates(
  from: CurrencyCode,
  to: CurrencyCode,
  giveAmount?: number
) {
  const debouncedGiveAmount = useDebouncedValue(giveAmount, GIVE_AMOUNT_DEBOUNCE_MS);
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
      if (debouncedGiveAmount != null && debouncedGiveAmount > 0) {
        params.set("amount", String(debouncedGiveAmount));
      }
      const res = await fetch(`/api/rates?${params}`);
      const json = (await res.json().catch(() => ({}))) as {
        rate?: number;
        updatedAt?: string;
        error?: string;
      };
      if (!res.ok) {
        throw new Error(json.error ?? "Не вдалося завантажити курси");
      }
      if (typeof json.rate !== "number" || !Number.isFinite(json.rate)) {
        throw new Error("Порожня відповідь курсів");
      }
      setRate(json.rate);
      setUpdatedAt(json.updatedAt ?? null);
      setError(null);
    } catch (e) {
      setRate(null);
      setError(e instanceof Error ? e.message : "Помилка завантаження курсів");
    } finally {
      setLoading(false);
    }
  }, [from, to, debouncedGiveAmount]);

  useEffect(() => {
    void load();
    const id = setInterval(() => void load(), REFRESH_MS);
    return () => clearInterval(id);
  }, [load]);

  return {
    rate,
    updatedAt,
    loading,
    error,
    refresh: load,
    /** Сума, для якої зараз (або останній раз) підтягували курс. */
    amountForRate: debouncedGiveAmount,
  };
}

function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const id = window.setTimeout(() => setDebounced(value), delayMs);
    return () => window.clearTimeout(id);
  }, [value, delayMs]);

  return debounced;
}
