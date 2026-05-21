import type { CurrencyCode } from "./data";

export const MIN_AMOUNT: Record<CurrencyCode, number> = {
  UAH: 2000,
  VND: 500000,
  USDT: 50,
};

/** В баннере курса показываем «за N», если 1 единица даёт слишком мелкий курс */
export const RATE_DISPLAY_BASE: Partial<Record<CurrencyCode, number>> = {
  VND: 10_000,
};
