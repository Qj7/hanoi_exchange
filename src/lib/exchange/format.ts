import type { CurrencyCode } from "./data";
import { RATE_DISPLAY_BASE } from "./constants";

export function formatNumber(value: number): string {
  return new Intl.NumberFormat("ru-RU", { maximumFractionDigits: 0 }).format(value);
}

export function formatMoney(value: number, code: CurrencyCode): string {
  const fractionDigits = code === "USDT" ? 2 : 0;
  return `${new Intl.NumberFormat("ru-RU", {
    maximumFractionDigits: fractionDigits,
    minimumFractionDigits: fractionDigits,
  }).format(value)} ${code}`;
}

export function formatRate(value: number): string {
  if (!Number.isFinite(value) || value <= 0) return "—";
  if (value >= 100) return value.toFixed(0);
  if (value >= 10) return value.toFixed(2);
  return value.toFixed(4);
}

/** Текст для баннера: N `from` → сумма в `to` (курс внутри остаётся за 1 единицу). */
export function formatRateQuote(
  from: CurrencyCode,
  to: CurrencyCode,
  rate: number
): { fromLabel: string; toLabel: string } {
  const base = RATE_DISPLAY_BASE[from] ?? 1;
  const fromLabel =
    base === 1 ? `1 ${from}` : `${formatNumber(base)} ${from}`;
  const toAmount = rate * base;
  const toLabel =
    to === "USDT"
      ? formatMoney(toAmount, "USDT")
      : `${formatRate(toAmount)} ${to}`;
  return { fromLabel, toLabel };
}
