import type { CurrencyCode } from "@/lib/exchange/data";
import {
  averagePrices,
  computePairRate,
  getConversionSteps,
  type ConversionStep,
  type FiatP2PCode,
  type P2PTradeType,
} from "@/lib/exchange/rates";

const BINANCE_SEARCH_URL =
  "https://p2p.binance.com/bapi/c2c/v2/friendly/c2c/adv/search";

/** 5 объявлений; в среднее идут #2–#5 (первое в JSON пропускаем). */
const ROWS = 5;
const CACHE_TTL_MS = 60_000;

interface BinanceSearchResponse {
  code?: string;
  success?: boolean;
  data?: Array<{ adv?: { price?: string } }>;
}

export type PairRateOptions = {
  forceRefresh?: boolean;
  /** Сумма «отдаю» — если есть, уходит в Binance как transAmount */
  giveAmount?: number;
};

type StepCacheKey = string;

const stepCache = new Map<
  StepCacheKey,
  { fiatPerUsdt: number; expiresAt: number }
>();

function stepCacheKey(
  fiat: FiatP2PCode,
  tradeType: P2PTradeType,
  transAmount?: number
): StepCacheKey {
  if (transAmount == null || !(transAmount > 0)) {
    return `${fiat}_${tradeType}`;
  }
  return `${fiat}_${tradeType}_${Math.round(transAmount)}`;
}

function parsePrice(raw: string | undefined): number | null {
  if (raw == null) return null;
  const n = parseFloat(String(raw));
  return Number.isFinite(n) && n > 0 ? n : null;
}

/** Цены adv.price из объявлений #2–#5 в JSON. */
async function fetchAdPrices(
  fiat: FiatP2PCode,
  tradeType: P2PTradeType,
  transAmount?: number
): Promise<number[]> {
  const body: Record<string, unknown> = {
    fiat,
    asset: "USDT",
    tradeType,
    page: 1,
    rows: ROWS,
  };
  if (transAmount != null && transAmount > 0) {
    body.transAmount = Math.round(transAmount);
  }

  const res = await fetch(BINANCE_SEARCH_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error(`Binance P2P ${fiat}/${tradeType}: HTTP ${res.status}`);
  }

  const json = (await res.json()) as BinanceSearchResponse;
  if (json.code !== "000000" || !json.success || !Array.isArray(json.data)) {
    throw new Error(`Binance P2P ${fiat}/${tradeType}: invalid response`);
  }

  const prices: number[] = [];
  for (const row of json.data.slice(1)) {
    const n = parsePrice(row.adv?.price);
    if (n != null) prices.push(n);
  }

  return prices;
}

async function fetchFiatPerUsdt(
  fiat: FiatP2PCode,
  tradeType: P2PTradeType,
  forceRefresh = false,
  transAmount?: number
): Promise<number> {
  const key = stepCacheKey(fiat, tradeType, transAmount);
  const now = Date.now();
  const hit = stepCache.get(key);
  if (!forceRefresh && hit && hit.expiresAt > now) {
    return hit.fiatPerUsdt;
  }

  const prices = await fetchAdPrices(fiat, tradeType, transAmount);
  const avg = averagePrices(prices);
  if (avg == null) {
    throw new Error(
      `Binance P2P ${fiat}/${tradeType}: no prices in ads 2–5`
    );
  }

  stepCache.set(key, { fiatPerUsdt: avg, expiresAt: now + CACHE_TTL_MS });
  return avg;
}

function transAmountForStep(
  step: ConversionStep,
  giveAmount: number | undefined,
  from: CurrencyCode | undefined
): number | undefined {
  if (giveAmount == null || !(giveAmount > 0) || from !== step.fiat) {
    return undefined;
  }
  return giveAmount;
}

async function fetchStepPrices(
  steps: ConversionStep[],
  forceRefresh: boolean,
  giveAmount?: number,
  from?: CurrencyCode
): Promise<number[]> {
  return Promise.all(
    steps.map((step) =>
      fetchFiatPerUsdt(
        step.fiat,
        step.tradeType,
        forceRefresh,
        transAmountForStep(step, giveAmount, from)
      )
    )
  );
}

export interface PairExchangeRate {
  from: CurrencyCode;
  to: CurrencyCode;
  rate: number;
  steps: ConversionStep[];
  /** fiat per 1 USDT for each step */
  stepPrices: number[];
  fetchedAt: number;
}

export async function getPairExchangeRate(
  from: CurrencyCode,
  to: CurrencyCode,
  options: PairRateOptions = {}
): Promise<PairExchangeRate> {
  const { forceRefresh = false, giveAmount } = options;
  const steps = getConversionSteps(from, to);
  if (!steps) {
    throw new Error(`Обмен ${from} → ${to} не поддерживается`);
  }

  if (steps.length === 0) {
    return {
      from,
      to,
      rate: 1,
      steps: [],
      stepPrices: [],
      fetchedAt: Date.now(),
    };
  }

  const stepPrices = await fetchStepPrices(
    steps,
    forceRefresh,
    giveAmount,
    from
  );
  const rate = computePairRate(from, to, stepPrices);
  if (rate == null) {
    throw new Error(`Не удалось рассчитать курс ${from} → ${to}`);
  }

  return {
    from,
    to,
    rate,
    steps,
    stepPrices,
    fetchedAt: Date.now(),
  };
}
