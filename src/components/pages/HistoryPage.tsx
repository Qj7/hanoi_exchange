"use client";

import { Card } from "@/components/ui/Card";
import { ArrowRightIcon, HistoryIcon } from "@/components/icons";

interface HistoryItem {
  id: string;
  date: string;
  from: { code: string; amount: string };
  to: { code: string; amount: string };
  status: "completed" | "pending" | "cancelled";
  method: string;
}

const HISTORY: HistoryItem[] = [];

const STATUS_LABEL: Record<HistoryItem["status"], string> = {
  completed: "Завершено",
  pending: "В обработке",
  cancelled: "Отменено",
};

const STATUS_STYLE: Record<HistoryItem["status"], string> = {
  completed: "text-[var(--success)] bg-[var(--success)]/10 border-[var(--success)]/30",
  pending: "text-[var(--info)] bg-[var(--info)]/10 border-[var(--info)]/30",
  cancelled: "text-[var(--danger)] bg-[var(--danger)]/10 border-[var(--danger)]/30",
};

export function HistoryPage() {
  if (HISTORY.length === 0) {
    return <EmptyState />;
  }

  return (
    <div className="px-4 pt-6 pb-6 space-y-2.5">
      {HISTORY.map((h) => (
        <Card key={h.id} className="p-4">
          <div className="flex items-center justify-between gap-2 mb-3">
            <div className="text-[11px] text-[var(--text-dim)] font-mono">
              {h.date}
            </div>
            <span
              className={`text-[10px] uppercase tracking-[0.14em] px-2 py-0.5 rounded border ${
                STATUS_STYLE[h.status]
              }`}
            >
              {STATUS_LABEL[h.status]}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex-1">
              <div className="text-[10px] uppercase text-[var(--text-dim)] tracking-wider">
                Отдали
              </div>
              <div className="text-sm font-mono mt-0.5">
                {h.from.amount} {h.from.code}
              </div>
            </div>
            <ArrowRightIcon className="w-4 h-4 text-[var(--text-dim)]" />
            <div className="flex-1 text-right">
              <div className="text-[10px] uppercase text-[var(--text-dim)] tracking-wider">
                Получили
              </div>
              <div className="text-sm font-mono mt-0.5">
                {h.to.amount} {h.to.code}
              </div>
            </div>
          </div>
          <div className="text-[11px] text-[var(--text-muted)] mt-3 pt-3 border-t border-[var(--border)]">
            {h.method}
          </div>
        </Card>
      ))}
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
