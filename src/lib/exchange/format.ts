import type { CurrencyCode } from "./data";

export function formatNumber(value: number): string {
  return new Intl.NumberFormat("ru-RU", { maximumFractionDigits: 0 }).format(value);
}

export function formatMoney(value: number, code: CurrencyCode): string {
  const fractionDigits = code === "USD" || code === "USDT" ? 2 : 0;
  return `${new Intl.NumberFormat("ru-RU", {
    maximumFractionDigits: fractionDigits,
    minimumFractionDigits: fractionDigits,
  }).format(value)} ${code}`;
}

export function formatRate(value: number): string {
  if (value >= 100) return value.toFixed(0);
  if (value >= 10) return value.toFixed(2);
  return value.toFixed(4);
}
