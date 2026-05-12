import { createClient } from "@supabase/supabase-js";
import { getPublicSupabaseUrl } from "@/lib/supabase/env-public";

/** Server uses the same project URL as the client (`NEXT_PUBLIC_SUPABASE_URL`). */
export function getSupabaseServerUrl(): string {
  return getPublicSupabaseUrl();
}

/** Server-only secret key (`sb_secret_…`). Full DB access; never expose to client. */
export function getSupabaseSecretKey(): string {
  return process.env.SUPABASE_SECRET_KEY?.trim() || "";
}

/** Server can run elevated queries (orders, admin list, health). */
export function isSupabaseServerConfigured(): boolean {
  return Boolean(getSupabaseServerUrl() && getSupabaseSecretKey());
}

/** Same as `isSupabaseServerConfigured` — заявки и админка читают БД только с сервера. */
export function hasOrdersDatabase(): boolean {
  return isSupabaseServerConfigured();
}

export type SupabaseHealthResult =
  | { ok: true }
  | { ok: false; error: string; httpStatus: 503 };

/** Server-only: checks DB via `app_config` using secret key. */
export async function runSupabaseHealthCheck(): Promise<SupabaseHealthResult> {
  const url = getSupabaseServerUrl();
  const key = getSupabaseSecretKey();
  if (!url || !key) {
    return {
      ok: false,
      error:
        "Задайте NEXT_PUBLIC_SUPABASE_URL и SUPABASE_SECRET_KEY.",
      httpStatus: 503 as const,
    };
  }

  const supabase = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { error } = await supabase.from("app_config").select("key").limit(1);

  if (error) {
    return { ok: false, error: error.message, httpStatus: 503 as const };
  }

  return { ok: true };
}
