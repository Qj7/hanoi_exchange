import { createSupabaseServiceClient } from "@/lib/server/supabase-service";
import { isSupabaseServerConfigured } from "@/lib/server/supabase-health";
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

export async function insertExchangeOrder(
  user: TelegramWebAppUser,
  payload: CreateOrderPayload
): Promise<{ ok: true; id: string } | { ok: false; message: string }> {
  if (!isSupabaseServerConfigured()) {
    return {
      ok: false,
      message:
        "Supabase не настроен: нужны NEXT_PUBLIC_SUPABASE_URL и SUPABASE_SECRET_KEY.",
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
  if (!isSupabaseServerConfigured()) {
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
  if (!isSupabaseServerConfigured()) {
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
