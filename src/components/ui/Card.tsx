import { HTMLAttributes } from "react";
import clsx from "clsx";

export function Card({
  className,
  children,
  ...rest
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={clsx(
        "rounded-xl bg-[var(--bg-elevated)] border border-[var(--border)]",
        className
      )}
      {...rest}
    >
      {children}
    </div>
  );
}
