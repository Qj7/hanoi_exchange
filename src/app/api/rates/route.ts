import { NextResponse } from "next/server";
import { getExchangeRatesSnapshot } from "@/lib/server/binance-p2p";

export async function GET() {
  try {
    const { legs, rates } = await getExchangeRatesSnapshot();

    return NextResponse.json({
      rates,
      legs: {
        UAH: legs.UAH,
        VND: legs.VND,
      },
      updatedAt: new Date(legs.fetchedAt).toISOString(),
    });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Не удалось получить курсы Binance";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
