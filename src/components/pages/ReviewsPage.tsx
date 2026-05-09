"use client";

import { Card } from "@/components/ui/Card";
import { StarIcon } from "@/components/icons";

interface Review {
  id: string;
  name: string;
  initials: string;
  date: string;
  rating: number;
  text: string;
  pair?: string;
}

const REVIEWS: Review[] = [
  {
    id: "1",
    name: "Алексей М.",
    initials: "АМ",
    date: "2 дня назад",
    rating: 5,
    text: "Меняли 80 000 ₽ на баты. Курс лучше, чем в обменниках на Уокинг-стрит. Менеджер отвечает быстро, встретились через 30 минут.",
    pair: "RUB → THB",
  },
  {
    id: "2",
    name: "Дарья К.",
    initials: "ДК",
    date: "5 дней назад",
    rating: 5,
    text: "Перевод по СБП — деньги получила в банкомате Bangkok Bank через 15 минут. Всё чётко.",
    pair: "RUB → THB",
  },
  {
    id: "3",
    name: "Иван П.",
    initials: "ИП",
    date: "1 нед. назад",
    rating: 4,
    text: "Поменял USDT на наличные доллары. Комиссия адекватная, документы выдали. Единственное — пришлось подождать оператора 20 минут.",
    pair: "USDT → USD",
  },
  {
    id: "4",
    name: "Сергей Л.",
    initials: "СЛ",
    date: "2 нед. назад",
    rating: 5,
    text: "Пользуюсь не первый раз. Стабильно хороший курс на крупные суммы, всегда подтверждают условия до встречи.",
    pair: "RUB → USD",
  },
];

const AVG = REVIEWS.reduce((s, r) => s + r.rating, 0) / REVIEWS.length;

export function ReviewsPage() {
  return (
    <div className="px-4 pt-6 pb-6 space-y-3">
      <Card className="p-5 flex items-center gap-5">
        <div>
          <div className="text-3xl font-semibold tracking-tight">
            {AVG.toFixed(1)}
          </div>
          <div className="flex items-center gap-0.5 mt-1">
            {Array.from({ length: 5 }).map((_, i) => (
              <StarIcon
                key={i}
                filled={i < Math.round(AVG)}
                className="w-3.5 h-3.5 text-[var(--accent)]"
              />
            ))}
          </div>
          <div className="text-[11px] text-[var(--text-dim)] mt-1">
            {REVIEWS.length} отзывов
          </div>
        </div>
        <div className="flex-1 grid gap-1.5">
          {[5, 4, 3, 2, 1].map((star) => {
            const count = REVIEWS.filter((r) => r.rating === star).length;
            const pct = (count / REVIEWS.length) * 100;
            return (
              <div key={star} className="flex items-center gap-2 text-[11px]">
                <span className="w-3 text-[var(--text-muted)]">{star}</span>
                <div className="flex-1 h-1.5 bg-[var(--bg-elevated-2)] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[var(--accent)] rounded-full"
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <span className="w-5 text-right text-[var(--text-dim)]">
                  {count}
                </span>
              </div>
            );
          })}
        </div>
      </Card>

      <div className="space-y-2.5">
        {REVIEWS.map((r) => (
          <Card key={r.id} className="p-4">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-full bg-[var(--bg-elevated-2)] border border-[var(--border-strong)] flex items-center justify-center text-xs font-semibold text-[var(--accent)] flex-shrink-0">
                {r.initials}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div className="text-sm font-medium">{r.name}</div>
                  <div className="text-[11px] text-[var(--text-dim)]">
                    {r.date}
                  </div>
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  <div className="flex items-center gap-0.5">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <StarIcon
                        key={i}
                        filled={i < r.rating}
                        className="w-3 h-3 text-[var(--accent)]"
                      />
                    ))}
                  </div>
                  {r.pair && (
                    <span className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-dim)] px-1.5 py-0.5 rounded border border-[var(--border)]">
                      {r.pair}
                    </span>
                  )}
                </div>
                <p className="text-[13px] text-[var(--text-muted)] leading-relaxed mt-2">
                  {r.text}
                </p>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
