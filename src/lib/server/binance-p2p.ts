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

const ROWS = 5;
const CACHE_TTL_MS = 60_000;

interface BinanceSearchResponse {
  code?: string;
  success?: boolean;
  data?: Array<{ adv?: { price?: string } }>;
}

type StepCacheKey = `${FiatP2PCode}_${P2PTradeType}`;

const stepCache = new Map<
  StepCacheKey,
  { fiatPerUsdt: number; expiresAt: number }
>();

function stepKey(fiat: FiatP2PCode, tradeType: P2PTradeType): StepCacheKey {
  return `${fiat}_${tradeType}`;
}

async function fetchAdPrices(
  fiat: FiatP2PCode,
  tradeType: P2PTradeType
): Promise<number[]> {
  const res = await fetch(BINANCE_SEARCH_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      fiat,
      asset: "USDT",
      tradeType,
      page: 1,
      rows: ROWS,
    }),
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
  for (const row of json.data) {
    const raw = row.adv?.price;
    if (raw == null) continue;
    const n = parseFloat(String(raw));
    if (Number.isFinite(n) && n > 0) prices.push(n);
  }

  return prices;
}

async function fetchFiatPerUsdt(
  fiat: FiatP2PCode,
  tradeType: P2PTradeType,
  forceRefresh = false
): Promise<number> {
  const key = stepKey(fiat, tradeType);
  const now = Date.now();
  const hit = stepCache.get(key);
  if (!forceRefresh && hit && hit.expiresAt > now) {
    return hit.fiatPerUsdt;
  }

  const prices = await fetchAdPrices(fiat, tradeType);
  const avg = averagePrices(prices);
  if (avg == null) {
    throw new Error(
      `Binance P2P ${fiat}/${tradeType}: no prices in top ${ROWS} ads`
    );
  }

  stepCache.set(key, { fiatPerUsdt: avg, expiresAt: now + CACHE_TTL_MS });
  return avg;
}

async function fetchStepPrices(
  steps: ConversionStep[],
  forceRefresh = false
): Promise<number[]> {
  return Promise.all(
    steps.map((s) => fetchFiatPerUsdt(s.fiat, s.tradeType, forceRefresh))
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
  forceRefresh = false
): Promise<PairExchangeRate> {
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

  const stepPrices = await fetchStepPrices(steps, forceRefresh);
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
