import { MIN_AMOUNT } from "@/lib/exchange/constants";
import {
  getRate,
  paymentOptionsFor,
  type CurrencyCode,
} from "@/lib/exchange/data";

export type CreateOrderPayload = {
  give_currency: CurrencyCode;
  receive_currency: CurrencyCode;
  amount_side: "give" | "receive";
  amount_input: number;
  pay_methods: string[];
  receive_method: string;
  give_amount: number;
  receive_amount: number;
  rate: number;
};

function isCurrencyCode(x: unknown): x is CurrencyCode {
  return (
    x === "UAH" || x === "VND" || x === "USD" || x === "USDT"
  );
}

export function validateCreateOrderBody(
  body: unknown
):
  | { ok: true; data: CreateOrderPayload }
  | { ok: false; message: string } {
  if (!body || typeof body !== "object") {
    return { ok: false, message: "Некорректное тело запроса" };
  }
  const o = body as Record<string, unknown>;

  const give = o.give_currency;
  const receive = o.receive_currency;
  const amountSide = o.amount_side;
  const amountInput = o.amount_input;
  const payMethods = o.pay_methods;
  const receiveMethod = o.receive_method;

  if (!isCurrencyCode(give) || !isCurrencyCode(receive)) {
    return { ok: false, message: "Некорректная валюта" };
  }
  if (give === receive) {
    return { ok: false, message: "Валюты не должны совпадать" };
  }

  if (amountSide !== "give" && amountSide !== "receive") {
    return { ok: false, message: "Некорректная сторона суммы" };
  }

  const numeric =
    typeof amountInput === "number"
      ? amountInput
      : typeof amountInput === "string"
        ? parseFloat(amountInput.replace(",", "."))
        : NaN;
  if (!Number.isFinite(numeric) || numeric <= 0) {
    return { ok: false, message: "Укажите сумму" };
  }

  const min =
    amountSide === "give" ? MIN_AMOUNT[give] : MIN_AMOUNT[receive];
  if (numeric < min) {
    return {
      ok: false,
      message: `Минимальная сумма: ${min} ${amountSide === "give" ? give : receive}`,
    };
  }

  const rate = getRate(give, receive);
  if (!rate) {
    return { ok: false, message: "Обмен этой пары временно недоступен" };
  }

  let giveAmount: number;
  let receiveAmount: number;
  if (amountSide === "receive") {
    receiveAmount = numeric;
    giveAmount = numeric / rate;
  } else {
    giveAmount = numeric;
    receiveAmount = numeric * rate;
  }

  if (!Array.isArray(payMethods) || payMethods.length === 0) {
    return { ok: false, message: "Выберите способ оплаты" };
  }
  const allowedGive = new Set(
    paymentOptionsFor("give", give).map((p) => p.id)
  );
  for (const id of payMethods) {
    if (typeof id !== "string" || !allowedGive.has(id)) {
      return { ok: false, message: "Некорректный способ оплаты" };
    }
  }

  if (typeof receiveMethod !== "string" || !receiveMethod.trim()) {
    return { ok: false, message: "Выберите способ получения" };
  }
  const allowedRecv = new Set(
    paymentOptionsFor("receive", receive).map((p) => p.id)
  );
  if (!allowedRecv.has(receiveMethod)) {
    return { ok: false, message: "Некорректный способ получения" };
  }

  return {
    ok: true,
    data: {
      give_currency: give,
      receive_currency: receive,
      amount_side: amountSide,
      amount_input: numeric,
      pay_methods: payMethods as string[],
      receive_method: receiveMethod,
      give_amount: giveAmount,
      receive_amount: receiveAmount,
      rate,
    },
  };
}
