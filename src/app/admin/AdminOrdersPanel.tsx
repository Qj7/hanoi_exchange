"use client";

import { useEffect, useState } from "react";
import type { AdminOrderRow } from "@/lib/server/orders-repository";
import { paymentOptionLabel, type CurrencyCode } from "@/lib/exchange/data";
import { formatMoney } from "@/lib/exchange/format";

function asCurrency(x: string): CurrencyCode {
  if (x === "UAH" || x === "VND" || x === "USD" || x === "USDT") return x;
  return "USD";
}

function num(v: string | number): number {
  if (typeof v === "number") return v;
  const n = parseFloat(v);
  return Number.isFinite(n) ? n : 0;
}

type Props = {
  initialRows: AdminOrderRow[];
  /** Интервал опроса (мс). */
  intervalMs?: number;
};

const LOG_PREFIX = "[hx-admin-orders]";

function dbg(stage: string, payload?: Record<string, unknown>) {
  if (typeof console === "undefined" || !console.info) return;
  if (payload && Object.keys(payload).length > 0) {
    console.info(LOG_PREFIX, stage, payload);
  } else {
    console.info(LOG_PREFIX, stage);
  }
}

type PollTrigger = "mount" | "interval" | "visibility";

export function AdminOrdersPanel({ initialRows, intervalMs = 5000 }: Props) {
  const [rows, setRows] = useState<AdminOrderRow[]>(initialRows);
  const [pollError, setPollError] = useState<string | null>(null);

  useEffect(() => {
    dbg("hydrate:initialRows", {
      count: initialRows.length,
      idsSample: initialRows.slice(0, 5).map((r) => r.id),
    });
    setRows(initialRows);
  }, [initialRows]);

  useEffect(() => {
    let cancelled = false;

    dbg("poll:effect_start", {
      intervalMs,
      url: "/api/admin/orders",
      hint: "Ищи в консоли фильтром: hx-admin-orders",
    });

    const load = async (trigger: PollTrigger) => {
      if (typeof document !== "undefined" && document.visibilityState === "hidden") {
        dbg("poll:skip_tab_hidden", { trigger });
        return;
      }

      const started = performance.now();
      dbg("poll:request", {
        trigger,
        visibilityState:
          typeof document !== "undefined" ? document.visibilityState : "n/a",
        credentials: "same-origin",
        cache: "no-store",
      });

      try {
        const res = await fetch("/api/admin/orders", {
          credentials: "same-origin",
          cache: "no-store",
        });
        const text = await res.text();
        const ms = Math.round(performance.now() - started);

        let data: unknown = null;
        let jsonError: string | null = null;
        if (text.length > 0) {
          try {
            data = JSON.parse(text) as unknown;
          } catch (e) {
            jsonError = e instanceof Error ? e.message : String(e);
          }
        }

        if (cancelled) {
          dbg("poll:aborted_after_fetch", { trigger, ms, bytes: text.length });
          return;
        }

        dbg("poll:http", {
          trigger,
          status: res.status,
          ok: res.ok,
          ms,
          bytes: text.length,
          contentType: res.headers.get("content-type"),
          jsonParseError: jsonError,
          bodyPreview: text.length > 800 ? `${text.slice(0, 800)}…` : text,
        });

        if (jsonError !== null) {
          const msg = "Ответ не JSON";
          setPollError(msg);
          dbg("poll:fail_json", { trigger, jsonError, rawLength: text.length });
          return;
        }

        if (res.status === 401) {
          dbg("poll:fail_unauthorized_redirect", { trigger, body: data });
          window.location.href = "/admin/login";
          return;
        }

        if (!res.ok) {
          const msg =
            data &&
            typeof data === "object" &&
            "error" in data &&
            typeof (data as { error: unknown }).error === "string"
              ? (data as { error: string }).error
              : "Не удалось обновить список";
          setPollError(msg);
          dbg("poll:fail_http", { trigger, status: res.status, message: msg, body: data });
          return;
        }

        if (
          data &&
          typeof data === "object" &&
          "orders" in data &&
          Array.isArray((data as { orders: unknown }).orders)
        ) {
          const next = (data as { orders: AdminOrderRow[] }).orders;
          setPollError(null);
          setRows(next);
          dbg("poll:ok", {
            trigger,
            count: next.length,
            idsHead: next.slice(0, 5).map((r) => r.id),
            idsTail: next.length > 5 ? next.slice(-3).map((r) => r.id) : [],
            ms,
          });
        } else {
          const keys =
            data && typeof data === "object" && data !== null
              ? Object.keys(data as object)
              : [];
          setPollError("Некорректный ответ сервера");
          dbg("poll:fail_shape", {
            trigger,
            typeofData: typeof data,
            keys,
            body: data,
          });
        }
      } catch (e) {
        const err = e instanceof Error ? e.message : String(e);
        const name = e instanceof Error ? e.name : "Error";
        if (!cancelled) {
          setPollError("Сеть недоступна");
          dbg("poll:fail_network", { trigger, name, message: err });
        }
      }
    };

    const id = setInterval(() => void load("interval"), intervalMs);
    const onVisible = () => {
      if (document.visibilityState === "visible") void load("visibility");
    };
    document.addEventListener("visibilitychange", onVisible);
    void load("mount");

    return () => {
      cancelled = true;
      dbg("poll:effect_cleanup");
      clearInterval(id);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [intervalMs]);

  if (rows.length === 0) {
    return (
      <div className="space-y-2">
        {pollError && (
          <p className="text-sm text-[var(--danger)]">{pollError}</p>
        )}
        <p className="text-sm text-[var(--text-muted)]">Пока нет заявок.</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {pollError && (
        <p className="text-sm text-[var(--danger)]">{pollError}</p>
      )}
      <div className="overflow-x-auto rounded-lg border border-[var(--border)]">
        <table className="w-full text-left text-sm">
          <thead className="bg-[var(--bg-elevated)] text-[10px] uppercase tracking-wider text-[var(--text-dim)]">
            <tr>
              <th className="px-3 py-2 font-medium">Дата</th>
              <th className="px-3 py-2 font-medium">Telegram</th>
              <th className="px-3 py-2 font-medium">Пара</th>
              <th className="px-3 py-2 font-medium">Суммы</th>
              <th className="px-3 py-2 font-medium">Способы</th>
              <th className="px-3 py-2 font-medium">Статус</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border)]">
            {rows.map((r) => {
              const created = new Date(r.created_at);
              const dateStr = Number.isFinite(created.getTime())
                ? created.toLocaleString("ru-RU")
                : r.created_at;
              const ga = num(r.give_amount);
              const ra = num(r.receive_amount);
              const tg =
                r.telegram_username != null && r.telegram_username !== ""
                  ? `@${r.telegram_username}`
                  : r.telegram_first_name != null
                    ? r.telegram_first_name
                    : String(r.telegram_user_id);
              const methods = [
                ...r.pay_methods.map(paymentOptionLabel),
                paymentOptionLabel(r.receive_method),
              ].join(" · ");

              return (
                <tr
                  key={r.id}
                  className="bg-[var(--bg-elevated-2)]/40 hover:bg-[var(--bg-elevated)]/60"
                >
                  <td className="px-3 py-2.5 font-mono text-xs whitespace-nowrap">
                    {dateStr}
                  </td>
                  <td className="px-3 py-2.5 text-xs max-w-[140px] truncate">
                    {tg}
                  </td>
                  <td className="px-3 py-2.5 font-mono text-xs whitespace-nowrap">
                    {r.give_currency} → {r.receive_currency}
                  </td>
                  <td className="px-3 py-2.5 font-mono text-xs whitespace-nowrap">
                    {formatMoney(ga, asCurrency(r.give_currency))}
                    <span className="text-[var(--text-dim)] mx-1">→</span>
                    {formatMoney(ra, asCurrency(r.receive_currency))}
                  </td>
                  <td className="px-3 py-2.5 text-xs text-[var(--text-muted)] max-w-[220px]">
                    {methods}
                  </td>
                  <td className="px-3 py-2.5 text-xs">{r.status}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
