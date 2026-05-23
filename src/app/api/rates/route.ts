import { NextResponse } from "next/server";
import type { CurrencyCode } from "@/lib/exchange/data";
import { getPairExchangeRate } from "@/lib/server/binance-p2p";

function parseCurrency(x: string | null): CurrencyCode | null {
  if (x === "UAH" || x === "VND" || x === "USDT") return x;
  return null;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const from = parseCurrency(searchParams.get("from"));
  const to = parseCurrency(searchParams.get("to"));

  if (!from || !to) {
    return NextResponse.json(
      { error: "Укажите параметры from и to (UAH, VND, USDT)" },
      { status: 400 }
    );
  }

  const amountRaw = searchParams.get("amount");
  const amount = amountRaw != null ? parseFloat(amountRaw) : NaN;
  const giveAmount =
    Number.isFinite(amount) && amount > 0 ? amount : undefined;

  try {
    const snapshot = await getPairExchangeRate(from, to, { giveAmount });

    return NextResponse.json({
      from: snapshot.from,
      to: snapshot.to,
      rate: snapshot.rate,
      steps: snapshot.steps,
      stepPrices: snapshot.stepPrices,
      updatedAt: new Date(snapshot.fetchedAt).toISOString(),
    });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Не удалось получить курсы Binance";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
