import type { CurrencyCode } from "./data";

/** Комиссия по сумме в UAH: <5k → 9%, ≥5k → 7%, ≥20k → 5%. */
export function uahMarkupPercent(uahAmount: number): number {
  if (uahAmount >= 20_000) return 5;
  if (uahAmount >= 5_000) return 7;
  return 9;
}

export type ConversionSides = {
  give: number;
  receive: number;
};

/** Сумма в UAH, от которой берётся процент комиссии. */
export function uahAmountForMarkup(
  give: CurrencyCode,
  receive: CurrencyCode,
  sides: ConversionSides
): number | null {
  if (give === "UAH") return sides.give;
  if (receive === "UAH") return sides.receive;
  return null;
}

/**
 * Курс без комиссии → give/receive с учётом процента по гривневой ноге сделки.
 */
export function applyUahMarkup(
  give: CurrencyCode,
  receive: CurrencyCode,
  amountSide: "give" | "receive",
  amountInput: number,
  rate: number
): ConversionSides {
  let giveAmount: number;
  let receiveAmount: number;

  if (amountSide === "receive") {
    receiveAmount = amountInput;
    giveAmount = amountInput / rate;
  } else {
    giveAmount = amountInput;
    receiveAmount = amountInput * rate;
  }

  const uahAmount = uahAmountForMarkup(give, receive, {
    give: giveAmount,
    receive: receiveAmount,
  });
  if (uahAmount == null) {
    return { give: giveAmount, receive: receiveAmount };
  }

  const markup = uahMarkupPercent(uahAmount) / 100;

  if (amountSide === "give") {
    receiveAmount *= 1 - markup;
  } else {
    giveAmount /= 1 - markup;
  }

  return { give: giveAmount, receive: receiveAmount };
}
