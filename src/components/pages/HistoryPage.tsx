"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/Card";
import { ArrowRightIcon, HistoryIcon } from "@/components/icons";
import {
  paymentOptionLabel,
  type CurrencyCode,
} from "@/lib/exchange/data";
import { formatMoney } from "@/lib/exchange/format";
import { useTelegram } from "@/lib/telegram/TelegramProvider";

type OrderStatus = "completed" | "pending" | "in_progress" | "cancelled";

function normalizeStatus(s: string): OrderStatus {
  if (
    s === "completed" ||
    s === "pending" ||
    s === "in_progress" ||
    s === "cancelled"
  ) {
    return s;
  }
  return "pending";
}

interface ApiOrder {
  id: string;
  created_at: string;
  give_currency: string;
  receive_currency: string;
  give_amount: string | number;
  receive_amount: string | number;
  status: string;
  pay_methods: string[];
  receive_method: string;
}

const STATUS_LABEL: Record<OrderStatus, string> = {
  completed: "Завершено",
  pending: "В очереди",
  in_progress: "В работе",
  cancelled: "Отменено",
};

const STATUS_STYLE: Record<OrderStatus, string> = {
  completed:
    "text-[var(--success)] bg-[var(--success)]/10 border-[var(--success)]/30",
  pending: "text-[var(--info)] bg-[var(--info)]/10 border-[var(--info)]/30",
  in_progress:
    "text-[var(--accent)] bg-[var(--accent-soft)] border-[var(--accent)]/35",
  cancelled:
    "text-[var(--danger)] bg-[var(--danger)]/10 border-[var(--danger)]/30",
};

function isCurrencyCode(x: string): x is CurrencyCode {
  return x === "UAH" || x === "VND" || x === "USD" || x === "USDT";
}

function num(v: string | number): number {
  if (typeof v === "number") return v;
  const n = parseFloat(v);
  return Number.isFinite(n) ? n : 0;
}

export function HistoryPage() {
  const { initData } = useTelegram();
  const [orders, setOrders] = useState<ApiOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryKey, setRetryKey] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (!initData) {
        setOrders([]);
        setLoading(false);
        setError(null);
        return;
      }

      setLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/orders", {
          headers: { "X-Telegram-Init-Data": initData },
        });
        const json = (await res.json()) as {
          orders?: ApiOrder[];
          error?: string;
        };
        if (cancelled) return;
        if (!res.ok) {
          setError(json.error ?? "Не удалось загрузить историю");
          setOrders([]);
          return;
        }
        setOrders(Array.isArray(json.orders) ? json.orders : []);
      } catch {
        if (!cancelled) {
          setError("Ошибка сети");
          setOrders([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [initData, retryKey]);

  if (loading) {
    return (
      <div className="px-6 py-20 flex flex-col items-center text-center">
        <p className="text-xs text-[var(--text-muted)]">Загрузка...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="px-6 py-16 flex flex-col items-center text-center gap-3">
        <p className="text-xs text-[var(--danger)]">{error}</p>
        <button
          type="button"
          onClick={() => setRetryKey((k) => k + 1)}
          className="text-xs text-[var(--accent)] underline"
        >
          Повторить
        </button>
      </div>
    );
  }

  if (orders.length === 0) {
    return <EmptyState />;
  }

  return (
    <div className="px-4 pt-6 pb-6 space-y-2.5">
      {orders.map((h) => {
        const st = normalizeStatus(h.status);
        const g = h.give_currency;
        const r = h.receive_currency;
        const giveCode = isCurrencyCode(g) ? g : "USD";
        const recvCode = isCurrencyCode(r) ? r : "USD";
        const methodLine = [
          ...h.pay_methods.map(paymentOptionLabel),
          paymentOptionLabel(h.receive_method),
        ].join(" · ");

        const created = new Date(h.created_at);
        const dateLabel = Number.isFinite(created.getTime())
          ? created.toLocaleString("ru-RU", {
              day: "2-digit",
              month: "short",
              hour: "2-digit",
              minute: "2-digit",
            })
          : h.created_at;

        return (
          <Card key={h.id} className="p-4">
            <div className="flex items-center justify-between gap-2 mb-3">
              <div className="text-[11px] text-[var(--text-dim)] font-mono">
                {dateLabel}
              </div>
              <span
                className={`text-[10px] uppercase tracking-[0.14em] px-2 py-0.5 rounded border ${
                  STATUS_STYLE[st]
                }`}
              >
                {STATUS_LABEL[st]}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex-1">
                <div className="text-[10px] uppercase text-[var(--text-dim)] tracking-wider">
                  Отдаёте
                </div>
                <div className="text-sm font-mono mt-0.5">
                  {formatMoney(num(h.give_amount), giveCode)}
                </div>
              </div>
              <ArrowRightIcon className="w-4 h-4 text-[var(--text-dim)]" />
              <div className="flex-1 text-right">
                <div className="text-[10px] uppercase text-[var(--text-dim)] tracking-wider">
                  Получаете
                </div>
                <div className="text-sm font-mono mt-0.5">
                  {formatMoney(num(h.receive_amount), recvCode)}
                </div>
              </div>
            </div>
            <div className="text-[11px] text-[var(--text-muted)] mt-3 pt-3 border-t border-[var(--border)]">
              {methodLine}
            </div>
          </Card>
        );
      })}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="px-6 py-20 flex flex-col items-center text-center">
      <div className="w-14 h-14 rounded-2xl bg-[var(--bg-elevated)] border border-[var(--border)] flex items-center justify-center text-[var(--text-dim)] mb-4">
        <HistoryIcon className="w-6 h-6" />
      </div>
      <h2 className="text-base font-semibold tracking-tight mb-1.5">
        История пуста
      </h2>
      <p className="text-xs text-[var(--text-muted)] max-w-[240px] leading-relaxed">
        Здесь появятся ваши заявки на обмен. Создайте первую — это занимает
        меньше минуты.
      </p>
    </div>
  );
}
