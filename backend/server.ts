import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { runSupabaseHealthCheck } from "../src/lib/server/supabase-health";

const app = new Hono();

app.use(
  "/*",
  cors({
    origin: process.env.BACKEND_CORS_ORIGIN?.split(",") ?? "*",
    allowMethods: ["GET", "POST", "OPTIONS"],
  }),
);

app.get("/health", (c) =>
  c.json({ ok: true, service: "hanoi-exchange-api" }),
);

/** Checks DB connectivity using the service role (bypasses RLS). */
app.get("/supabase/health", async (c) => {
  const result = await runSupabaseHealthCheck();
  if (!result.ok) {
    return c.json({ ok: false, error: result.error }, result.httpStatus);
  }
  return c.json({ ok: true });
});

const port = Number(process.env.PORT) || 8787;

serve({ fetch: app.fetch, port }, (info) => {
  console.log(`API listening on http://localhost:${info.port}`);
});
