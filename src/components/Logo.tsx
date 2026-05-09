import { LogoMark } from "./icons";

interface LogoProps {
  size?: "sm" | "md" | "lg";
  showSubtitle?: boolean;
}

export function Logo({ size = "md", showSubtitle = false }: LogoProps) {
  const dim = size === "lg" ? 40 : size === "sm" ? 24 : 32;
  const titleClass =
    size === "lg" ? "text-2xl" : size === "sm" ? "text-base" : "text-lg";

  return (
    <div className="flex items-center gap-2.5">
      <LogoMark
        width={dim}
        height={dim}
        className="text-[var(--accent)]"
      />
      <div className="flex flex-col leading-none">
        <span
          className={`${titleClass} font-semibold tracking-tight text-[var(--text)]`}
        >
          Hanoi<span className="text-[var(--accent)]">.</span>Exchange
        </span>
        {showSubtitle && (
          <span className="text-[10px] uppercase tracking-[0.18em] text-[var(--text-dim)] mt-1">
            Currency Exchange Service
          </span>
        )}
      </div>
    </div>
  );
}
