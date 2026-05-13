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

/** Ссылка на чат с пользователем в клиенте Telegram (Mini App / бот). */
function telegramChatHref(
  telegramUserId: number,
  username: string | null | undefined
): string {
  const raw = username?.trim();
  if (raw) {
    const clean = raw.replace(/^@/, "");
    if (clean) return `https://t.me/${encodeURIComponent(clean)}`;
  }
  return `tg://user?id=${telegramUserId}`;
}

type Props = {
  initialRows: AdminOrderRow[];
  /** Интервал опроса (мс). */
  intervalMs?: number;
};

export function AdminOrdersPanel({ initialRows, intervalMs = 5000 }: Props) {
  const [rows, setRows] = useState<AdminOrderRow[]>(initialRows);
  const [pollError, setPollError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      if (typeof document !== "undefined" && document.visibilityState === "hidden") {
        return;
      }
      try {
        const res = await fetch("/api/admin/orders", {
          credentials: "same-origin",
          cache: "no-store",
        });
        const data: unknown = await res.json().catch(() => null);
        if (cancelled) return;

        if (res.status === 401) {
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
          return;
        }

        if (
          data &&
          typeof data === "object" &&
          "orders" in data &&
          Array.isArray((data as { orders: unknown }).orders)
        ) {
          setPollError(null);
          setRows((data as { orders: AdminOrderRow[] }).orders);
        } else {
          setPollError("Некорректный ответ сервера");
        }
      } catch {
        if (!cancelled) setPollError("Сеть недоступна");
      }
    };

    const id = setInterval(() => void load(), intervalMs);
    const onVisible = () => {
      if (document.visibilityState === "visible") void load();
    };
    document.addEventListener("visibilitychange", onVisible);
    void load();

    return () => {
      cancelled = true;
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
              const tgLabel =
                r.telegram_username != null && r.telegram_username !== ""
                  ? `@${r.telegram_username}`
                  : r.telegram_first_name != null
                    ? r.telegram_first_name
                    : String(r.telegram_user_id);
              const tgHref = telegramChatHref(r.telegram_user_id, r.telegram_username);
              const tgLinkIsHttps = tgHref.startsWith("https:");
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
                  <td className="px-3 py-2.5 text-xs max-w-[160px] truncate">
                    <a
                      href={tgHref}
                      className="text-[var(--accent)] hover:underline"
                      {...(tgLinkIsHttps
                        ? { target: "_blank", rel: "noopener noreferrer" }
                        : { rel: "noreferrer" })}
                    >
                      {tgLabel}
                    </a>
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
