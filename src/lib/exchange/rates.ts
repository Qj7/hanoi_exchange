import type { CurrencyCode } from "./data";

export type FiatP2PCode = "UAH" | "VND" | "USD";

/** Fiat per 1 USDT from Binance P2P (avg of top 5 ads). */
export interface UsdtFiatLeg {
  buy: number;
  sell: number;
}

export type RatePairKey = `${CurrencyCode}_${CurrencyCode}`;

export type RateTable = Partial<Record<RatePairKey, number>>;

export interface BinanceLegSnapshot {
  UAH: UsdtFiatLeg;
  VND: UsdtFiatLeg;
  USD: UsdtFiatLeg;
  fetchedAt: number;
}

export function averagePrices(prices: number[]): number | null {
  if (prices.length === 0) return null;
  const sum = prices.reduce((acc, p) => acc + p, 0);
  return sum / prices.length;
}

/**
 * Build app rates (1 from = N to) from Binance USDT/fiat legs.
 * - buy: tradeType BUY — user buys USDT (SELL ads), fiat per USDT
 * - sell: tradeType SELL — user sells USDT (BUY ads), fiat per USDT
 */
export function buildRateTable(legs: BinanceLegSnapshot): RateTable {
  const { UAH, VND, USD } = legs;
  const table: RateTable = {};

  if (UAH.buy > 0 && VND.sell > 0) {
    table.UAH_VND = VND.sell / UAH.buy;
  }
  if (VND.buy > 0 && UAH.sell > 0) {
    table.VND_UAH = UAH.sell / VND.buy;
  }

  if (UAH.buy > 0) {
    table.UAH_USDT = 1 / UAH.buy;
  }
  if (UAH.sell > 0) {
    table.USDT_UAH = UAH.sell;
  }

  if (VND.buy > 0) {
    table.VND_USDT = 1 / VND.buy;
  }
  if (VND.sell > 0) {
    table.USDT_VND = VND.sell;
  }

  if (USD.buy > 0) {
    table.USD_USDT = 1 / USD.buy;
  }
  if (USD.sell > 0) {
    table.USDT_USD = USD.sell;
  }

  if (UAH.buy > 0 && USD.sell > 0) {
    table.UAH_USD = USD.sell / UAH.buy;
  }
  if (USD.buy > 0 && UAH.sell > 0) {
    table.USD_UAH = UAH.sell / USD.buy;
  }

  if (VND.buy > 0 && USD.sell > 0) {
    table.VND_USD = USD.sell / VND.buy;
  }
  if (USD.buy > 0 && VND.sell > 0) {
    table.USD_VND = VND.sell / USD.buy;
  }

  return table;
}

export function getRateFromTable(
  table: RateTable,
  from: CurrencyCode,
  to: CurrencyCode
): number | null {
  if (from === to) return 1;
  return table[`${from}_${to}`] ?? null;
}
