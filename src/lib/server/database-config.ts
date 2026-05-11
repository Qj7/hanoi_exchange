import { isSupabaseServiceConfigured } from "@/lib/server/supabase-health";

/** Локальный Postgres (например Docker на `localhost`). */
export function isLocalPostgresConfigured(): boolean {
  return Boolean(process.env.DATABASE_URL?.trim());
}

/** Есть ли бэкенд для заявок: Docker Postgres или Supabase. */
export function hasOrdersDatabase(): boolean {
  return isLocalPostgresConfigured() || isSupabaseServiceConfigured();
}
