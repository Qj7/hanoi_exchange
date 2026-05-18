import {
  averagePrices,
  buildRateTable,
  type BinanceLegSnapshot,
  type FiatP2PCode,
  type RateTable,
  type UsdtFiatLeg,
} from "@/lib/exchange/rates";

const BINANCE_SEARCH_URL =
  "https://p2p.binance.com/bapi/c2c/v2/friendly/c2c/adv/search";

const ROWS = 5;
const CACHE_TTL_MS = 60_000;

type TradeType = "BUY" | "SELL";

interface BinanceSearchResponse {
  code?: string;
  success?: boolean;
  data?: Array<{ adv?: { price?: string } }>;
}

let cached:
  | {
      legs: BinanceLegSnapshot;
      table: RateTable;
      expiresAt: number;
    }
  | undefined;

async function fetchAdPrices(
  fiat: FiatP2PCode,
  tradeType: TradeType
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

async function fetchUsdtFiatLeg(fiat: FiatP2PCode): Promise<UsdtFiatLeg> {
  const [buyPrices, sellPrices] = await Promise.all([
    fetchAdPrices(fiat, "BUY"),
    fetchAdPrices(fiat, "SELL"),
  ]);

  const buy = averagePrices(buyPrices);
  const sell = averagePrices(sellPrices);

  if (buy == null || sell == null) {
    throw new Error(`Binance P2P ${fiat}: no prices in top ${ROWS} ads`);
  }

  return { buy, sell };
}

async function fetchBinanceLegs(): Promise<BinanceLegSnapshot> {
  const [UAH, VND, USD] = await Promise.all([
    fetchUsdtFiatLeg("UAH"),
    fetchUsdtFiatLeg("VND"),
    fetchUsdtFiatLeg("USD"),
  ]);

  return {
    UAH,
    VND,
    USD,
    fetchedAt: Date.now(),
  };
}

export interface ExchangeRatesSnapshot {
  legs: BinanceLegSnapshot;
  rates: RateTable;
}

export async function getExchangeRatesSnapshot(
  forceRefresh = false
): Promise<ExchangeRatesSnapshot> {
  const now = Date.now();
  if (!forceRefresh && cached && cached.expiresAt > now) {
    return { legs: cached.legs, rates: cached.table };
  }

  const legs = await fetchBinanceLegs();
  const table = buildRateTable(legs);

  cached = {
    legs,
    table,
    expiresAt: now + CACHE_TTL_MS,
  };

  return { legs, rates: table };
}
