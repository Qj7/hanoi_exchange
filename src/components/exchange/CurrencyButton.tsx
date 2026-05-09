"use client";

import clsx from "clsx";
import type { Currency } from "@/lib/exchange/data";

interface CurrencyButtonProps {
  currency: Currency;
  selected?: boolean;
  onClick?: () => void;
}

export function CurrencyButton({
  currency,
  selected,
  onClick,
}: CurrencyButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={clsx(
        "flex items-center gap-2 px-4 h-11 rounded-lg border transition-all min-w-[110px] justify-center",
        selected
          ? "bg-[var(--accent-soft)] border-[var(--accent)] text-[var(--text)]"
          : "bg-[var(--bg-elevated-2)] border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text)] hover:border-[var(--border-strong)]"
      )}
    >
      <span
        className={clsx(
          "inline-flex items-center justify-center w-7 h-7 rounded-full text-[10px] font-semibold",
          selected
            ? "bg-[var(--accent)] text-[#11151f]"
            : "bg-[var(--bg)] text-[var(--text-muted)]"
        )}
      >
        {currency.flag}
      </span>
      <span className="font-medium tracking-tight text-sm">{currency.code}</span>
    </button>
  );
}
