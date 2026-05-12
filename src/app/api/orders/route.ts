import { NextResponse } from "next/server";
import { hasOrdersDatabase } from "@/lib/server/supabase-health";
import {
  insertExchangeOrder,
  listOrdersForUser,
} from "@/lib/server/orders-repository";
import { validateTelegramWebAppInitData } from "@/lib/server/telegram-web-app";
import { validateCreateOrderBody } from "@/lib/server/validate-create-order";

const INIT_HEADER = "x-telegram-init-data";

function getBotToken(): string | undefined {
  return process.env.TELEGRAM_BOT_TOKEN?.trim();
}

export async function POST(request: Request) {
  const botToken = getBotToken();
  if (!botToken) {
    return NextResponse.json(
      { error: "TELEGRAM_BOT_TOKEN не настроен на сервере" },
      { status: 503 }
    );
  }

  const initData = request.headers.get(INIT_HEADER)?.trim() ?? "";
  const validated = validateTelegramWebAppInitData(initData, botToken);
  if (!validated) {
    return NextResponse.json({ error: "Недействительные данные Telegram" }, { status: 401 });
  }

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: "Ожидался JSON" }, { status: 400 });
  }

  const checked = validateCreateOrderBody(json);
  if (!checked.ok) {
    return NextResponse.json({ error: checked.message }, { status: 400 });
  }

  const d = checked.data;

  if (!hasOrdersDatabase()) {
    return NextResponse.json(
      {
        error:
          "Supabase не настроен: NEXT_PUBLIC_SUPABASE_URL и SUPABASE_SECRET_KEY (см. DEPLOY.md).",
      },
      { status: 503 }
    );
  }

  const saved = await insertExchangeOrder(validated.user, d);
  if (!saved.ok) {
    return NextResponse.json({ error: saved.message }, { status: 500 });
  }

  return NextResponse.json({ id: saved.id });
}

export async function GET(request: Request) {
  const botToken = getBotToken();
  if (!botToken) {
    return NextResponse.json(
      { error: "TELEGRAM_BOT_TOKEN не настроен на сервере" },
      { status: 503 }
    );
  }

  const initData = request.headers.get(INIT_HEADER)?.trim() ?? "";
  const validated = validateTelegramWebAppInitData(initData, botToken);
  if (!validated) {
    return NextResponse.json({ error: "Недействительные данные Telegram" }, { status: 401 });
  }

  if (!hasOrdersDatabase()) {
    return NextResponse.json({ orders: [] });
  }

  const orders = await listOrdersForUser(validated.user.id);
  if (!Array.isArray(orders)) {
    return NextResponse.json({ error: orders.error }, { status: 500 });
  }

  return NextResponse.json({ orders });
}
