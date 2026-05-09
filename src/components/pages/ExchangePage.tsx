"use client";

import { useMemo, useState } from "react";
import {
  CURRENCY_MAP,
  getRate,
  paymentOptionsFor,
  type CurrencyCode,
} from "@/lib/exchange/data";
import { Card } from "@/components/ui/Card";
import { CurrencyButton } from "@/components/exchange/CurrencyButton";
import { CurrencyPicker } from "@/components/exchange/CurrencyPicker";
import { PaymentMethodSelector } from "@/components/exchange/PaymentMethodSelector";
import { ArrowRightIcon, SwapIcon } from "@/components/icons";
import { useTelegram } from "@/lib/telegram/TelegramProvider";

const MIN_AMOUNT: Record<CurrencyCode, number> = {
  RUB: 5000,
  THB: 1000,
  USD: 50,
  USDT: 50,
};

type Side = "give" | "receive";

export function ExchangePage() {
  const { haptic, webApp } = useTelegram();

  const [give, setGive] = useState<CurrencyCode>("RUB");
  const [receive, setReceive] = useState<CurrencyCode>("THB");
  const [pickerOpen, setPickerOpen] = useState<Side | null>(null);
  const [amountSide, setAmountSide] = useState<Side>("receive");
  const [amount, setAmount] = useState<string>("");
  const [payMethods, setPayMethods] = useState<string[]>([]);
  const [receiveMethods, setReceiveMethods] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const giveCurrency = CURRENCY_MAP[give];
  const receiveCurrency = CURRENCY_MAP[receive];
  const rate = getRate(give, receive);

  const payOptions = useMemo(() => paymentOptionsFor("give", give), [give]);
  const receiveOptions = useMemo(
    () => paymentOptionsFor("receive", receive),
    [receive]
  );

  const numericAmount = parseFloat(amount.replace(",", ".")) || 0;
  const min = amountSide === "give" ? MIN_AMOUNT[give] : MIN_AMOUNT[receive];

  const conversion = useMemo(() => {
    if (!rate || !numericAmount) return null;
    if (amountSide === "receive") {
      const giveValue = numericAmount / rate;
      return { give: giveValue, receive: numericAmount };
    }
    const receiveValue = numericAmount * rate;
    return { give: numericAmount, receive: receiveValue };
  }, [rate, numericAmount, amountSide]);

  const swap = () => {
    haptic("medium");
    setGive(receive);
    setReceive(give);
    setPayMethods([]);
    setReceiveMethods([]);
  };

  const togglePay = (id: string) => {
    haptic("light");
    setPayMethods((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    );
  };
  const toggleReceive = (id: string) => {
    haptic("light");
    setReceiveMethods((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    );
  };

  const errors: string[] = [];
  if (give === receive) errors.push("Валюты не должны совпадать");
  if (!numericAmount) errors.push("Укажите сумму");
  else if (numericAmount < min)
    errors.push(
      `Минимальная сумма: ${formatNumber(min)} ${
        amountSide === "give" ? give : receive
      }`
    );
  if (!rate) errors.push("Обмен этой пары временно недоступен");
  if (payMethods.length === 0) errors.push("Выберите способ оплаты");
  if (receiveMethods.length === 0) errors.push("Выберите способ получения");

  const isValid = errors.length === 0;

  const handleSubmit = async () => {
    if (!isValid || submitting) return;
    setSubmitting(true);
    haptic("heavy");

    try {
      await new Promise((r) => setTimeout(r, 700));
      setSuccess(true);
      haptic("rigid");
      try {
        webApp?.HapticFeedback?.notificationOccurred("success");
      } catch {
        // noop
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return <SuccessScreen onClose={() => setSuccess(false)} />;
  }

  return (
    <div className="px-4 pt-4 pb-6 space-y-3">
      <RateBanner
        from={give}
        to={receive}
        rate={rate}
      />

      <Card className="p-5">
        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
          <div className="flex flex-col items-center gap-2">
            <Label>Отдаю</Label>
            <CurrencyButton
              currency={giveCurrency}
              selected
              onClick={() => setPickerOpen("give")}
            />
          </div>
          <button
            type="button"
            onClick={swap}
            aria-label="Поменять местами"
            className="w-9 h-9 rounded-full border border-[var(--border-strong)] bg-[var(--bg-elevated-2)] text-[var(--text-muted)] hover:text-[var(--accent)] hover:border-[var(--accent)] transition-colors flex items-center justify-center"
          >
            <SwapIcon className="w-4 h-4" />
          </button>
          <div className="flex flex-col items-center gap-2">
            <Label>Получаю</Label>
            <CurrencyButton
              currency={receiveCurrency}
              selected
              onClick={() => setPickerOpen("receive")}
            />
          </div>
        </div>
      </Card>

      <Card className="p-5 space-y-4">
        <div className="flex items-center justify-between">
          <Label>
            Сумма в{" "}
            <span className="text-[var(--text)]">
              {amountSide === "give" ? give : receive}
            </span>
          </Label>
          <button
            type="button"
            onClick={() => {
              haptic("light");
              setAmountSide((s) => (s === "give" ? "receive" : "give"));
            }}
            className="inline-flex items-center gap-1.5 h-7 px-2.5 rounded-md text-[11px] font-medium border border-[var(--border-strong)] text-[var(--text-muted)] hover:text-[var(--accent)] hover:border-[var(--accent)] transition-colors"
          >
            <SwapIcon className="w-3 h-3" />
            Считать в {amountSide === "give" ? receive : give}
          </button>
        </div>

        <div className="flex items-stretch gap-2">
          <div className="flex items-center px-3 rounded-lg bg-[var(--bg-elevated-2)] border border-[var(--border)] text-xs font-semibold text-[var(--text-muted)] min-w-[58px] justify-center">
            {amountSide === "give" ? give : receive}
          </div>
          <input
            type="text"
            inputMode="decimal"
            placeholder={`От ${formatNumber(min)}`}
            value={amount}
            onChange={(e) => {
              const cleaned = e.target.value.replace(/[^\d.,]/g, "");
              setAmount(cleaned);
            }}
            className="flex-1 h-11 bg-[var(--bg-elevated-2)] border border-[var(--border)] rounded-lg px-4 text-base font-medium tracking-tight focus:outline-none focus:border-[var(--accent)] transition-colors placeholder:text-[var(--text-dim)]"
          />
        </div>

        {conversion && rate && (
          <div className="flex items-center justify-between text-xs">
            <span className="text-[var(--text-muted)]">К получению</span>
            <span className="font-mono text-[var(--text)]">
              {formatMoney(
                amountSide === "receive" ? conversion.give : conversion.receive,
                amountSide === "receive" ? give : receive
              )}
            </span>
          </div>
        )}
      </Card>

      <Card className="p-5 space-y-3">
        <Label>Способ оплаты</Label>
        <PaymentMethodSelector
          options={payOptions}
          selectedIds={payMethods}
          onToggle={togglePay}
        />
      </Card>

      <Card className="p-5 space-y-3">
        <Label>Способ получения</Label>
        <PaymentMethodSelector
          options={receiveOptions}
          selectedIds={receiveMethods}
          onToggle={toggleReceive}
        />
        <p className="text-[11px] text-[var(--text-dim)]">
          Другие способы получения откроются после первой сделки
        </p>
      </Card>

      {errors.length > 0 && amount.length > 0 && (
        <ul className="text-[11px] text-[var(--danger)] space-y-1 px-1">
          {errors.map((e) => (
            <li key={e}>· {e}</li>
          ))}
        </ul>
      )}

      <button
        type="button"
        disabled={!isValid || submitting}
        onClick={handleSubmit}
        className="w-full h-12 rounded-lg bg-[var(--accent)] text-[#11151f] font-semibold tracking-tight flex items-center justify-center gap-2 transition-all disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[var(--accent-hover)] active:scale-[0.99]"
      >
        {submitting ? (
          "Отправка..."
        ) : (
          <>
            Отправить заявку
            <ArrowRightIcon className="w-4 h-4" />
          </>
        )}
      </button>

      <CurrencyPicker
        open={pickerOpen !== null}
        selected={pickerOpen === "give" ? give : receive}
        exclude={pickerOpen === "give" ? receive : give}
        onClose={() => setPickerOpen(null)}
        onSelect={(code) => {
          haptic("light");
          if (pickerOpen === "give") {
            setGive(code);
            setPayMethods([]);
          } else {
            setReceive(code);
            setReceiveMethods([]);
          }
        }}
      />
    </div>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <span className="text-[11px] uppercase tracking-[0.14em] text-[var(--text-dim)] font-medium">
      {children}
    </span>
  );
}

function RateBanner({
  from,
  to,
  rate,
}: {
  from: CurrencyCode;
  to: CurrencyCode;
  rate: number | null;
}) {
  if (!rate) return null;
  return (
    <div className="flex items-center justify-between px-4 py-2.5 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border)]">
      <span className="text-[11px] uppercase tracking-[0.14em] text-[var(--text-dim)]">
        Текущий курс
      </span>
      <div className="flex items-center gap-2 font-mono text-xs">
        <span className="text-[var(--text-muted)]">1 {from}</span>
        <ArrowRightIcon className="w-3 h-3 text-[var(--text-dim)]" />
        <span className="text-[var(--accent)] font-semibold">
          {formatRate(rate)} {to}
        </span>
      </div>
    </div>
  );
}

function SuccessScreen({ onClose }: { onClose: () => void }) {
  return (
    <div className="px-6 py-16 flex flex-col items-center text-center animate-fade-in-up">
      <div className="w-16 h-16 rounded-full bg-[var(--success)]/15 border border-[var(--success)]/40 flex items-center justify-center mb-5">
        <svg
          viewBox="0 0 24 24"
          className="w-8 h-8 text-[var(--success)]"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="m5 12 5 5L20 7" />
        </svg>
      </div>
      <h2 className="text-xl font-semibold tracking-tight mb-2">
        Заявка отправлена
      </h2>
      <p className="text-sm text-[var(--text-muted)] max-w-xs leading-relaxed mb-7">
        Менеджер свяжется с вами в Telegram в течение 5 минут для подтверждения
        обмена.
      </p>
      <button
        type="button"
        onClick={onClose}
        className="h-11 px-6 rounded-lg border border-[var(--border-strong)] text-sm text-[var(--text)] hover:border-[var(--accent)] hover:text-[var(--accent)] transition-colors"
      >
        Создать ещё одну
      </button>
    </div>
  );
}

function formatNumber(value: number): string {
  return new Intl.NumberFormat("ru-RU", { maximumFractionDigits: 0 }).format(value);
}
function formatMoney(value: number, code: CurrencyCode): string {
  const fractionDigits = code === "USD" || code === "USDT" ? 2 : 0;
  return `${new Intl.NumberFormat("ru-RU", {
    maximumFractionDigits: fractionDigits,
    minimumFractionDigits: fractionDigits,
  }).format(value)} ${code}`;
}
function formatRate(value: number): string {
  if (value >= 100) return value.toFixed(0);
  if (value >= 10) return value.toFixed(2);
  return value.toFixed(4);
}
