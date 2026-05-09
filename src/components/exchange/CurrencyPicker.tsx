"use client";

import { useEffect } from "react";
import clsx from "clsx";
import { CURRENCIES, type CurrencyCode } from "@/lib/exchange/data";

interface CurrencyPickerProps {
  open: boolean;
  selected: CurrencyCode;
  exclude?: CurrencyCode;
  onClose: () => void;
  onSelect: (code: CurrencyCode) => void;
}

export function CurrencyPicker({
  open,
  selected,
  exclude,
  onClose,
  onSelect,
}: CurrencyPickerProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <button
        type="button"
        aria-label="Закрыть"
        onClick={onClose}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in-up"
      />
      <div className="relative w-full max-w-md bg-[var(--bg-elevated)] border border-[var(--border)] rounded-t-2xl sm:rounded-2xl mx-0 sm:mx-4 animate-fade-in-up">
        <div className="px-5 pt-4 pb-3 flex items-center justify-between border-b border-[var(--border)]">
          <h3 className="text-sm font-semibold tracking-tight">Выберите валюту</h3>
          <button
            type="button"
            onClick={onClose}
            className="text-[var(--text-muted)] hover:text-[var(--text)] text-sm"
          >
            Отмена
          </button>
        </div>
        <ul className="py-2 max-h-[60vh] overflow-y-auto">
          {CURRENCIES.map((c) => {
            const disabled = c.code === exclude;
            const isSelected = c.code === selected;
            return (
              <li key={c.code}>
                <button
                  type="button"
                  disabled={disabled}
                  onClick={() => {
                    onSelect(c.code);
                    onClose();
                  }}
                  className={clsx(
                    "w-full flex items-center gap-3 px-5 py-3 text-left transition-colors",
                    disabled
                      ? "opacity-30 cursor-not-allowed"
                      : "hover:bg-[var(--bg-elevated-2)]",
                    isSelected && "bg-[var(--accent-soft)]"
                  )}
                >
                  <span className="inline-flex items-center justify-center w-9 h-9 rounded-full bg-[var(--bg)] border border-[var(--border)] text-xs font-semibold text-[var(--text-muted)]">
                    {c.flag}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium">
                      {c.code}{" "}
                      <span className="text-[var(--text-dim)] font-normal">
                        · {c.symbol}
                      </span>
                    </div>
                    <div className="text-xs text-[var(--text-muted)] truncate">
                      {c.label}
                    </div>
                  </div>
                  {isSelected && (
                    <span className="text-[var(--accent)] text-xs uppercase tracking-wider">
                      Выбрано
                    </span>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
        <div className="h-[env(safe-area-inset-bottom)]" />
      </div>
    </div>
  );
}
