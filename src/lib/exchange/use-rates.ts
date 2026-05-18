"use client";

import { useCallback, useEffect, useState } from "react";
import type { RateTable } from "./rates";
import { getRateFromTable } from "./rates";
import type { CurrencyCode } from "./data";

const REFRESH_MS = 60_000;

export function useExchangeRates() {
  const [rates, setRates] = useState<RateTable | null>(null);
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/rates");
      const json = (await res.json().catch(() => ({}))) as {
        rates?: RateTable;
        updatedAt?: string;
        error?: string;
      };
      if (!res.ok) {
        throw new Error(json.error ?? "Не удалось загрузить курсы");
      }
      if (!json.rates) {
        throw new Error("Пустой ответ курсов");
      }
      setRates(json.rates);
      setUpdatedAt(json.updatedAt ?? null);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Ошибка загрузки курсов");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
    const id = setInterval(() => void load(), REFRESH_MS);
    return () => clearInterval(id);
  }, [load]);

  const getRate = useCallback(
    (from: CurrencyCode, to: CurrencyCode) => {
      if (!rates) return null;
      return getRateFromTable(rates, from, to);
    },
    [rates]
  );

  return { rates, updatedAt, loading, error, getRate, refresh: load };
}
