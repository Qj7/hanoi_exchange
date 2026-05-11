import postgres from "postgres";

let sql: ReturnType<typeof postgres> | undefined;

export function getLocalPostgres() {
  const url = process.env.DATABASE_URL?.trim();
  if (!url) return null;
  if (!sql) {
    sql = postgres(url, { max: 5, idle_timeout: 20, connect_timeout: 10 });
  }
  return sql;
}
