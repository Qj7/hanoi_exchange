export type CurrencyCode = "RUB" | "THB" | "USD" | "USDT";

export interface Currency {
  code: CurrencyCode;
  label: string;
  flag: string;
  symbol: string;
}

export const CURRENCIES: Currency[] = [
  { code: "RUB", label: "Российский рубль", flag: "RU", symbol: "₽" },
  { code: "THB", label: "Тайский бат", flag: "TH", symbol: "฿" },
  { code: "USD", label: "Доллар США", flag: "US", symbol: "$" },
  { code: "USDT", label: "Tether (TRC-20)", flag: "₮", symbol: "₮" },
];

export const CURRENCY_MAP: Record<CurrencyCode, Currency> = CURRENCIES.reduce(
  (acc, c) => {
    acc[c.code] = c;
    return acc;
  },
  {} as Record<CurrencyCode, Currency>
);

// Mid-market rates expressed as: 1 unit of [from] = N units of [to]
// In production you'd fetch this from an API; here it's hard-coded for demo.
const RATE_TABLE: Partial<Record<`${CurrencyCode}_${CurrencyCode}`, number>> = {
  RUB_THB: 0.36,
  THB_RUB: 2.78,
  RUB_USD: 0.0103,
  USD_RUB: 97.2,
  THB_USD: 0.0288,
  USD_THB: 34.7,
  RUB_USDT: 0.0103,
  USDT_RUB: 97.0,
  THB_USDT: 0.0288,
  USDT_THB: 34.7,
  USD_USDT: 1.0,
  USDT_USD: 1.0,
};

export function getRate(from: CurrencyCode, to: CurrencyCode): number | null {
  if (from === to) return 1;
  return RATE_TABLE[`${from}_${to}`] ?? null;
}

export interface PaymentOption {
  id: string;
  label: string;
  currencies: CurrencyCode[];
  group: "give" | "receive";
  hint?: string;
}

export const PAYMENT_OPTIONS: PaymentOption[] = [
  // GIVE side (way to pay)
  { id: "cash_rub", label: "Наличные RUB", currencies: ["RUB"], group: "give" },
  { id: "cash_thb", label: "Наличные THB", currencies: ["THB"], group: "give" },
  { id: "cash_usd", label: "Наличные USD", currencies: ["USD"], group: "give" },
  { id: "sber", label: "Сбербанк", currencies: ["RUB"], group: "give" },
  { id: "tinkoff", label: "Т-Банк (Тинькофф)", currencies: ["RUB"], group: "give" },
  { id: "sbp", label: "СБП", currencies: ["RUB"], group: "give" },
  { id: "kbank", label: "Kasikorn / SCB", currencies: ["THB"], group: "give" },
  { id: "usdt_trc20", label: "USDT TRC-20", currencies: ["USDT"], group: "give" },
  // RECEIVE side
  { id: "in_person", label: "Личная встреча", currencies: ["RUB", "THB", "USD"], group: "receive" },
  { id: "atm_bbl", label: "Банкомат Bangkok Bank", currencies: ["THB"], group: "receive" },
  { id: "transfer_thb", label: "Перевод на THB-карту", currencies: ["THB"], group: "receive" },
  { id: "transfer_rub", label: "Перевод на RUB-карту", currencies: ["RUB"], group: "receive" },
  { id: "usdt_receive", label: "USDT TRC-20", currencies: ["USDT"], group: "receive" },
];

export function paymentOptionsFor(
  group: "give" | "receive",
  currency: CurrencyCode
): PaymentOption[] {
  return PAYMENT_OPTIONS.filter(
    (o) => o.group === group && o.currencies.includes(currency)
  );
}
