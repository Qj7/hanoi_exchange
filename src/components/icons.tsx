import { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement>;

export function ExchangeIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M4 7h13l-3-3" />
      <path d="M20 17H7l3 3" />
    </svg>
  );
}

export function ProfileIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21c0-4.418 3.582-8 8-8s8 3.582 8 8" />
    </svg>
  );
}

export function ReviewsIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M21 12a8 8 0 0 1-11.6 7.16L4 20l.84-5.4A8 8 0 1 1 21 12Z" />
    </svg>
  );
}

export function HistoryIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M3 12a9 9 0 1 0 3-6.7" />
      <path d="M3 4v5h5" />
      <path d="M12 7v5l3 2" />
    </svg>
  );
}

export function TelegramIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M21.94 4.5 18.7 19.4c-.24 1.1-.9 1.36-1.83.85l-5.05-3.72-2.44 2.34c-.27.27-.5.5-1.02.5l.36-5.16 9.4-8.5c.4-.36-.09-.56-.63-.2L6.85 12.94 1.84 11.4c-1.1-.34-1.13-1.1.23-1.62L20.5 3.06c.9-.34 1.7.22 1.44 1.44Z" />
    </svg>
  );
}

export function ArrowRightIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M5 12h14" />
      <path d="m13 6 6 6-6 6" />
    </svg>
  );
}

export function SwapIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M7 4 3 8l4 4" />
      <path d="M3 8h13a4 4 0 0 1 4 4" />
      <path d="m17 20 4-4-4-4" />
      <path d="M21 16H8a4 4 0 0 1-4-4" />
    </svg>
  );
}

export function CheckIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="m5 12 5 5L20 7" />
    </svg>
  );
}

export function ShieldIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M12 22s8-4 8-11V5l-8-3-8 3v6c0 7 8 11 8 11Z" />
    </svg>
  );
}

export function ClockIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </svg>
  );
}

export function StarIcon(props: IconProps & { filled?: boolean }) {
  const { filled, ...rest } = props;
  return (
    <svg viewBox="0 0 24 24" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" {...rest}>
      <path d="m12 2.5 2.9 6.1 6.6.7-4.9 4.6 1.4 6.6L12 17.3l-6 3.2 1.4-6.6L2.5 9.3l6.6-.7L12 2.5Z" />
    </svg>
  );
}

export function ChevronDownIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

export function LogoMark(props: IconProps) {
  return (
    <svg viewBox="0 0 32 32" fill="none" {...props}>
      <rect x="1" y="1" width="30" height="30" rx="7" stroke="currentColor" strokeOpacity="0.35" />
      <path d="M9 21V11h3.4c2 0 3.2 1.1 3.2 2.8 0 1.2-.7 2-1.7 2.4v.1c1.2.3 2 1.2 2 2.5 0 1.9-1.3 3.2-3.6 3.2H9Zm2-6.1h1.3c1 0 1.6-.5 1.6-1.3s-.6-1.3-1.6-1.3H11v2.6Zm0 4.4h1.5c1.1 0 1.7-.5 1.7-1.4 0-.9-.6-1.4-1.7-1.4H11v2.8Z" fill="currentColor" />
      <path d="M17 21V11h2v4h3v-4h2v10h-2v-4.2h-3V21h-2Z" fill="currentColor" />
    </svg>
  );
}
