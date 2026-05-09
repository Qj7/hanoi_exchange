"use client";

import clsx from "clsx";
import type { PaymentOption } from "@/lib/exchange/data";

interface PaymentMethodSelectorProps {
  options: PaymentOption[];
  selectedIds: string[];
  onToggle: (id: string) => void;
  multiple?: boolean;
}

export function PaymentMethodSelector({
  options,
  selectedIds,
  onToggle,
  multiple = true,
}: PaymentMethodSelectorProps) {
  if (options.length === 0) {
    return (
      <div className="px-3 py-2 text-xs text-[var(--text-muted)] italic">
        Нет доступных способов для выбранной валюты
      </div>
    );
  }

  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((opt) => {
        const isSelected = selectedIds.includes(opt.id);
        return (
          <button
            key={opt.id}
            type="button"
            onClick={() => onToggle(opt.id)}
            className={clsx(
              "inline-flex items-center gap-2 h-8 px-3 rounded-md text-xs font-medium border transition-all",
              isSelected
                ? "bg-[var(--accent-soft)] border-[var(--accent)] text-[var(--text)]"
                : "bg-[var(--bg-elevated-2)] border-[var(--border)] text-[var(--text-muted)] hover:border-[var(--border-strong)] hover:text-[var(--text)]"
            )}
          >
            <span
              className={clsx(
                "inline-flex items-center justify-center w-4 h-4 rounded-sm border transition-colors",
                isSelected
                  ? "bg-[var(--accent)] border-[var(--accent)] text-[#11151f]"
                  : "border-[var(--border-strong)] text-transparent"
              )}
              aria-hidden
            >
              <svg viewBox="0 0 16 16" className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                <path d="m3 8 3.5 3.5L13 5" />
              </svg>
            </span>
            {opt.label}
          </button>
        );
      })}
      {!multiple && (
        <span className="sr-only">Выберите один вариант</span>
      )}
    </div>
  );
}
