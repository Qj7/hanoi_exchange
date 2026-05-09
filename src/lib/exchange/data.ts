export type CurrencyCode = "UAH" | "VND" | "USD" | "USDT";

export interface Currency {
  code: CurrencyCode;
  label: string;
  flag: string;
  symbol: string;
}

export const CURRENCIES: Currency[] = [
  { code: "UAH", label: "Украинская гривна", flag: "UA", symbol: "₴" },
  { code: "VND", label: "Вьетнамский донг", flag: "VN", symbol: "₫" },
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
  UAH_VND: 627.7,
  VND_UAH: 0.0016,
  UAH_USD: 0.024,
  USD_UAH: 41.7,
  VND_USD: 0.000039,
  USD_VND: 25500,
  UAH_USDT: 0.024,
  USDT_UAH: 41.7,
  VND_USDT: 0.000039,
  USDT_VND: 25500,
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
  { id: "cash_uah", label: "Наличные UAH", currencies: ["UAH"], group: "give" },
  { id: "cash_vnd", label: "Наличные VND", currencies: ["VND"], group: "give" },
  { id: "cash_usd", label: "Наличные USD", currencies: ["USD"], group: "give" },
  { id: "mono", label: "Monobank", currencies: ["UAH"], group: "give" },
  { id: "privat24", label: "Приват24", currencies: ["UAH"], group: "give" },
  { id: "pumb", label: "ПУМБ", currencies: ["UAH"], group: "give" },
  { id: "vietcombank", label: "Vietcombank / BIDV", currencies: ["VND"], group: "give" },
  { id: "usdt_trc20", label: "USDT TRC-20", currencies: ["USDT"], group: "give" },
  // RECEIVE side
  { id: "in_person", label: "Личная встреча", currencies: ["UAH", "VND", "USD"], group: "receive" },
  { id: "atm_vcb", label: "Банкомат Vietcombank", currencies: ["VND"], group: "receive" },
  { id: "transfer_vnd", label: "Перевод на VND-карту", currencies: ["VND"], group: "receive" },
  { id: "transfer_uah", label: "Перевод на UAH-карту", currencies: ["UAH"], group: "receive" },
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
