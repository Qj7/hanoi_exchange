import { createBrowserClient } from "@supabase/ssr";
import {
  getPublicSupabasePublishableKey,
  getPublicSupabaseUrl,
} from "@/lib/supabase/env-public";

export function createSupabaseBrowserClient() {
  const url = getPublicSupabaseUrl();
  const key = getPublicSupabasePublishableKey();
  if (!url || !key) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
    );
  }
  return createBrowserClient(url, key);
}
