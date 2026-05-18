export type CurrencyCode = "UAH" | "VND" | "USDT";

export interface Currency {
  code: CurrencyCode;
  label: string;
  flag: string;
  symbol: string;
}

export const CURRENCIES: Currency[] = [
  { code: "UAH", label: "Украинская гривна", flag: "UA", symbol: "₴" },
  { code: "VND", label: "Вьетнамский донг", flag: "VN", symbol: "₫" },
  { code: "USDT", label: "Tether (TRC-20)", flag: "₮", symbol: "₮" },
];

export const CURRENCY_MAP: Record<CurrencyCode, Currency> = CURRENCIES.reduce(
  (acc, c) => {
    acc[c.code] = c;
    return acc;
  },
  {} as Record<CurrencyCode, Currency>
);

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
  { id: "mono", label: "Monobank", currencies: ["UAH"], group: "give" },
  { id: "privat24", label: "Приват24", currencies: ["UAH"], group: "give" },
  { id: "pumb", label: "ПУМБ", currencies: ["UAH"], group: "give" },
  { id: "vietcombank", label: "Vietcombank / BIDV", currencies: ["VND"], group: "give" },
  { id: "usdt_trc20", label: "USDT TRC-20", currencies: ["USDT"], group: "give" },
  // RECEIVE side
  { id: "in_person", label: "Личная встреча", currencies: ["UAH", "VND"], group: "receive" },
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

export function paymentOptionLabel(id: string): string {
  const opt = PAYMENT_OPTIONS.find((o) => o.id === id);
  return opt?.label ?? id;
}
