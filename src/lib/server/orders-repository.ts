import { isSupabaseServiceConfigured } from "@/lib/server/supabase-health";
import { createSupabaseServiceClient } from "@/lib/server/supabase-service";
import { isLocalPostgresConfigured } from "@/lib/server/database-config";
import { getLocalPostgres } from "@/lib/server/pg-local";
import type { CreateOrderPayload } from "@/lib/server/validate-create-order";
import type { TelegramWebAppUser } from "@/lib/server/telegram-web-app";

export type OrderListItem = {
  id: string;
  created_at: string;
  give_currency: string;
  receive_currency: string;
  give_amount: string | number;
  receive_amount: string | number;
  status: string;
  pay_methods: string[];
  receive_method: string;
  rate?: string | number | null;
};

export type AdminOrderRow = OrderListItem & {
  telegram_user_id: number;
  telegram_username: string | null;
  telegram_first_name: string | null;
};

function preferLocalPostgres(): boolean {
  return isLocalPostgresConfigured();
}

export async function insertExchangeOrder(
  user: TelegramWebAppUser,
  payload: CreateOrderPayload
): Promise<{ ok: true; id: string } | { ok: false; message: string }> {
  if (preferLocalPostgres()) {
    const sql = getLocalPostgres();
    if (!sql) {
      return { ok: false, message: "DATABASE_URL не доступен" };
    }
    try {
      const rows = await sql<{ id: string }[]>`
        insert into exchange_orders (
          telegram_user_id,
          telegram_username,
          telegram_first_name,
          give_currency,
          receive_currency,
          amount_side,
          amount_input,
          give_amount,
          receive_amount,
          rate,
          pay_methods,
          receive_method,
          status
        ) values (
          ${user.id},
          ${user.username ?? null},
          ${user.first_name ?? null},
          ${payload.give_currency},
          ${payload.receive_currency},
          ${payload.amount_side},
          ${payload.amount_input},
          ${payload.give_amount},
          ${payload.receive_amount},
          ${payload.rate},
          ${sql.array(payload.pay_methods)},
          ${payload.receive_method},
          'pending'
        )
        returning id
      `;
      const id = rows[0]?.id;
      if (!id) return { ok: false, message: "Не удалось сохранить заявку" };
      return { ok: true, id };
    } catch {
      return { ok: false, message: "Не удалось сохранить заявку" };
    }
  }

  if (!isSupabaseServiceConfigured()) {
    return {
      ok: false,
      message:
        "Нет базы данных: задайте DATABASE_URL (локальный Postgres) или Supabase.",
    };
  }

  try {
    const supabase = createSupabaseServiceClient();
    const { data, error } = await supabase
      .from("exchange_orders")
      .insert({
        telegram_user_id: user.id,
        telegram_username: user.username ?? null,
        telegram_first_name: user.first_name ?? null,
        give_currency: payload.give_currency,
        receive_currency: payload.receive_currency,
        amount_side: payload.amount_side,
        amount_input: payload.amount_input,
        give_amount: payload.give_amount,
        receive_amount: payload.receive_amount,
        rate: payload.rate,
        pay_methods: payload.pay_methods,
        receive_method: payload.receive_method,
        status: "pending",
      })
      .select("id")
      .single();

    if (error || !data?.id) {
      return { ok: false, message: "Не удалось сохранить заявку" };
    }
    return { ok: true, id: data.id };
  } catch {
    return { ok: false, message: "Не удалось сохранить заявку" };
  }
}

export async function listOrdersForUser(
  telegramUserId: number
): Promise<OrderListItem[] | { error: string }> {
  if (preferLocalPostgres()) {
    const sql = getLocalPostgres();
    if (!sql) return { error: "DATABASE_URL не доступен" };
    try {
      const rows = await sql<OrderListItem[]>`
        select
          id,
          created_at::text,
          give_currency,
          receive_currency,
          give_amount,
          receive_amount,
          status,
          pay_methods,
          receive_method,
          rate
        from exchange_orders
        where telegram_user_id = ${telegramUserId}
        order by created_at desc
        limit 100
      `;
      return rows;
    } catch {
      return { error: "Не удалось загрузить историю" };
    }
  }

  if (!isSupabaseServiceConfigured()) {
    return [];
  }

  try {
    const supabase = createSupabaseServiceClient();
    const { data, error } = await supabase
      .from("exchange_orders")
      .select(
        "id, created_at, give_currency, receive_currency, give_amount, receive_amount, status, pay_methods, receive_method, rate"
      )
      .eq("telegram_user_id", telegramUserId)
      .order("created_at", { ascending: false })
      .limit(100);

    if (error) return { error: "Не удалось загрузить историю" };
    return (data ?? []) as OrderListItem[];
  } catch {
    return { error: "Не удалось загрузить историю" };
  }
}

export async function listAllOrdersForAdmin(): Promise<
  AdminOrderRow[] | { error: string }
> {
  if (preferLocalPostgres()) {
    const sql = getLocalPostgres();
    if (!sql) return { error: "DATABASE_URL не доступен" };
    try {
      const rows = await sql<AdminOrderRow[]>`
        select
          id,
          created_at::text,
          telegram_user_id,
          telegram_username,
          telegram_first_name,
          give_currency,
          receive_currency,
          give_amount,
          receive_amount,
          status,
          pay_methods,
          receive_method
        from exchange_orders
        order by created_at desc
        limit 300
      `;
      return rows;
    } catch {
      return { error: "Не удалось загрузить заявки" };
    }
  }

  if (!isSupabaseServiceConfigured()) {
    return [];
  }

  try {
    const supabase = createSupabaseServiceClient();
    const { data, error } = await supabase
      .from("exchange_orders")
      .select(
        "id, created_at, telegram_user_id, telegram_username, telegram_first_name, give_currency, receive_currency, give_amount, receive_amount, status, pay_methods, receive_method"
      )
      .order("created_at", { ascending: false })
      .limit(300);

    if (error) return { error: error.message };
    return (data ?? []) as AdminOrderRow[];
  } catch {
    return { error: "Не удалось загрузить заявки" };
  }
}
