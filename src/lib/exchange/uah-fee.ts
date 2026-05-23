import type { CurrencyCode } from "./data";

/** Пороги комиссии в гривневом эквиваленте. */
const TIER_UAH_MID = 5_000;
const TIER_UAH_HIGH = 20_000;

/** База для пересчёта: 5 000 ₴ = 100 USDT = 2 500 000 ₫. */
export const FEE_REF_UAH = 5_000;
export const FEE_REF_USDT = 100;
export const FEE_REF_VND = 2_500_000;

/** Сколько UAH в 1 единице валюты (по фиксированным эквивалентам). */
const UAH_PER_UNIT: Record<CurrencyCode, number> = {
  UAH: 1,
  USDT: FEE_REF_UAH / FEE_REF_USDT,
  VND: FEE_REF_UAH / FEE_REF_VND,
};

export function toUahEquivalent(
  amount: number,
  currency: CurrencyCode
): number {
  return amount * UAH_PER_UNIT[currency];
}

/** Комиссия по сумме в UAH-эквиваленте: <5k → 9%, ≥5k → 7%, ≥20k → 5%. */
export function uahMarkupPercent(uahEquivalent: number): number {
  if (uahEquivalent >= TIER_UAH_HIGH) return 5;
  if (uahEquivalent >= TIER_UAH_MID) return 7;
  return 9;
}

export type ConversionSides = {
  give: number;
  receive: number;
};

/**
 * Курс Binance + комиссия сверху (не вычитается из суммы к получению).
 * Ступень комиссии — по UAH-эквиваленту введённой суммы.
 *
 * give: клиент указывает сумму обмена → получает полный курс, комиссия сверху к отдаче.
 * receive: клиент указывает желаемую сумму → базовая стоимость + комиссия сверху к отдаче.
 */
export function applyUahMarkup(
  give: CurrencyCode,
  receive: CurrencyCode,
  amountSide: "give" | "receive",
  amountInput: number,
  rate: number
): ConversionSides {
  const tierCurrency = amountSide === "give" ? give : receive;
  const uahEquivalent = toUahEquivalent(amountInput, tierCurrency);
  const markup = uahMarkupPercent(uahEquivalent) / 100;

  if (amountSide === "receive") {
    return {
      give: (amountInput / rate) * (1 + markup),
      receive: amountInput,
    };
  }

  return {
    give: amountInput * (1 + markup),
    receive: amountInput * rate,
  };
}
