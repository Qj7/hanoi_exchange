import type { CurrencyCode } from "./data";

export type FiatP2PCode = "UAH" | "VND";
export type P2PTradeType = "BUY" | "SELL";

/** One Binance P2P search: fiat per 1 USDT (avg of top ads). */
export interface ConversionStep {
  fiat: FiatP2PCode;
  /** BUY — buy USDT with fiat; SELL — sell USDT for fiat */
  tradeType: P2PTradeType;
}

export function averagePrices(prices: number[]): number | null {
  if (prices.length === 0) return null;
  const sum = prices.reduce((acc, p) => acc + p, 0);
  return sum / prices.length;
}

/**
 * Binance P2P requests needed to convert `from` → `to`.
 * Cross fiat pairs go through USDT in two steps.
 */
export function getConversionSteps(
  from: CurrencyCode,
  to: CurrencyCode
): ConversionStep[] | null {
  if (from === to) return [];

  if (from === "UAH" && to === "USDT") {
    return [{ fiat: "UAH", tradeType: "BUY" }];
  }
  if (from === "VND" && to === "USDT") {
    return [{ fiat: "VND", tradeType: "BUY" }];
  }
  if (from === "USDT" && to === "UAH") {
    return [{ fiat: "UAH", tradeType: "SELL" }];
  }
  if (from === "USDT" && to === "VND") {
    return [{ fiat: "VND", tradeType: "SELL" }];
  }

  // UAH → VND: buy USDT for UAH, sell USDT for VND
  if (from === "UAH" && to === "VND") {
    return [
      { fiat: "UAH", tradeType: "BUY" },
      { fiat: "VND", tradeType: "SELL" },
    ];
  }

  // VND → UAH: buy USDT for VND, sell USDT for UAH
  if (from === "VND" && to === "UAH") {
    return [
      { fiat: "VND", tradeType: "BUY" },
      { fiat: "UAH", tradeType: "SELL" },
    ];
  }

  return null;
}

/**
 * App rate: 1 `from` = N `to`.
 * `prices[i]` — fiat per 1 USDT for step i from getConversionSteps.
 */
export function computePairRate(
  from: CurrencyCode,
  to: CurrencyCode,
  prices: number[]
): number | null {
  const steps = getConversionSteps(from, to);
  if (!steps) return null;
  if (from === to) return 1;
  if (steps.length !== prices.length) return null;

  if (steps.length === 1) {
    const p = prices[0];
    const step = steps[0];
    if (!(p > 0)) return null;
    if (from !== "USDT" && to === "USDT" && step.tradeType === "BUY") {
      return 1 / p;
    }
    if (from === "USDT" && to !== "USDT" && step.tradeType === "SELL") {
      return p;
    }
    return null;
  }

  if (steps.length === 2) {
    const [p1, p2] = prices;
    if (!(p1 > 0 && p2 > 0)) return null;
    if (steps[0].tradeType === "BUY" && steps[1].tradeType === "SELL") {
      return p2 / p1;
    }
    return null;
  }

  return null;
}
