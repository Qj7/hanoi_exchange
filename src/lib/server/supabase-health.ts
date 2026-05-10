import { createClient } from "@supabase/supabase-js";

export function getSupabaseProjectUrl(): string {
  return (
    process.env.SUPABASE_URL?.trim() ||
    process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ||
    ""
  );
}

export function getSupabaseServiceRoleKey(): string {
  return process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() || "";
}

export type SupabaseHealthResult =
  | { ok: true }
  | { ok: false; error: string; httpStatus: 503 };

/** Server-only check using the service role (bypasses RLS). */
export async function runSupabaseHealthCheck(): Promise<SupabaseHealthResult> {
  const url = getSupabaseProjectUrl();
  const key = getSupabaseServiceRoleKey();
  if (!url || !key) {
    return {
      ok: false,
      error:
        "Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY for the API.",
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
