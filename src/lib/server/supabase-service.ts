import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import {
  getSupabaseSecretKey,
  getSupabaseServerUrl,
} from "@/lib/server/supabase-health";

export function createSupabaseServiceClient(): SupabaseClient {
  const url = getSupabaseServerUrl();
  const key = getSupabaseSecretKey();
  if (!url || !key) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SECRET_KEY",
    );
  }
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
