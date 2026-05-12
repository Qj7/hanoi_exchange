import Link from "next/link";
import { hasOrdersDatabase } from "@/lib/server/supabase-health";
import {
  listAllOrdersForAdmin,
  type AdminOrderRow,
} from "@/lib/server/orders-repository";
import { requireAdminSession } from "@/lib/server/require-admin";
import { paymentOptionLabel, type CurrencyCode } from "@/lib/exchange/data";
import { formatMoney } from "@/lib/exchange/format";
import { AdminLogoutButton } from "./AdminLogoutButton";
import { AdminOrdersAutoRefresh } from "./AdminOrdersAutoRefresh";

function asCurrency(x: string): CurrencyCode {
  if (x === "UAH" || x === "VND" || x === "USD" || x === "USDT") return x;
  return "USD";
}

function num(v: string | number): number {
  if (typeof v === "number") return v;
  const n = parseFloat(v);
  return Number.isFinite(n) ? n : 0;
}

export default async function AdminDashboardPage() {
  await requireAdminSession();

  let rows: AdminOrderRow[] = [];
  let fetchError: string | null = null;
  const dbSkipped = !hasOrdersDatabase();

  if (!dbSkipped) {
    const result = await listAllOrdersForAdmin();
    if (!Array.isArray(result)) fetchError = result.error;
    else rows = result;
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {!dbSkipped && !fetchError && <AdminOrdersAutoRefresh />}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Заявки</h1>
          <p className="text-xs text-[var(--text-muted)] mt-1">
            Все заявки из Telegram Mini App
          </p>
        </div>
        <div className="flex items-center gap-3">
          <AdminLogoutButton />
          <Link
            href="/"
            className="text-xs text-[var(--text-muted)] hover:text-[var(--accent)]"
          >
            На сайт
          </Link>
        </div>
      </div>

      {dbSkipped && (
        <p className="text-sm text-[var(--info)] mb-6 leading-relaxed max-w-xl">
          Supabase для сервера не настроен. В{" "}
          <code className="font-mono text-xs text-[var(--text-muted)]">
            .env.local
          </code>{" "}
          или на хостинге задай{" "}
          <code className="font-mono text-xs text-[var(--text-muted)]">
            NEXT_PUBLIC_SUPABASE_URL
          </code>
          ,{" "}
          <code className="font-mono text-xs text-[var(--text-muted)]">
            NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
          </code>
          ,{" "}
          <code className="font-mono text-xs text-[var(--text-muted)]">
            SUPABASE_SECRET_KEY
          </code>
          . См.{" "}
          <code className="font-mono text-xs">DEPLOY.md</code>.
        </p>
      )}

      {fetchError && (
        <p className="text-sm text-[var(--danger)] mb-6">{fetchError}</p>
      )}

      {!fetchError && !dbSkipped && rows && rows.length === 0 && (
        <p className="text-sm text-[var(--text-muted)]">Пока нет заявок.</p>
      )}

      {!fetchError && !dbSkipped && rows && rows.length > 0 && (
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
      )}
    </div>
  );
}
