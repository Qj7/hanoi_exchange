import Link from "next/link";
import { hasOrdersDatabase } from "@/lib/server/supabase-health";
import { listAllOrdersForAdmin, type AdminOrderRow } from "@/lib/server/orders-repository";
import { requireAdminSession } from "@/lib/server/require-admin";
import { AdminLogoutButton } from "./AdminLogoutButton";
import { AdminOrdersPanel } from "./AdminOrdersPanel";

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

      {!fetchError && !dbSkipped && <AdminOrdersPanel initialRows={rows} />}
    </div>
  );
}
