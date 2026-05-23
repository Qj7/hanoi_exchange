"use client";

import { useMemo, useState } from "react";
import { useDebouncedValue } from "@/lib/use-debounced-value";
import { MIN_AMOUNT } from "@/lib/exchange/constants";
import {
  CURRENCY_MAP,
  paymentOptionsFor,
  type CurrencyCode,
} from "@/lib/exchange/data";
import { useExchangeRates } from "@/lib/exchange/use-rates";
import { formatMoney, formatNumber } from "@/lib/exchange/format";
import { applyUahMarkup } from "@/lib/exchange/uah-fee";
import { Card } from "@/components/ui/Card";
import { CurrencyButton } from "@/components/exchange/CurrencyButton";
import { CurrencyPicker } from "@/components/exchange/CurrencyPicker";
import { ArrowRightIcon, SwapIcon } from "@/components/icons";
import { useTelegram } from "@/lib/telegram/TelegramProvider";

type Side = "give" | "receive";

const AMOUNT_DEBOUNCE_MS = 400;

function parseAmountInput(value: string): number {
  return parseFloat(value.replace(",", ".")) || 0;
}

export function ExchangePage() {
  const { haptic, webApp, initData } = useTelegram();

  const [give, setGive] = useState<CurrencyCode>("UAH");
  const [receive, setReceive] = useState<CurrencyCode>("VND");
  const [pickerOpen, setPickerOpen] = useState<Side | null>(null);
  const [amountSide] = useState<Side>("give");
  const [amount, setAmount] = useState<string>("");
  const debouncedAmount = useDebouncedValue(amount, AMOUNT_DEBOUNCE_MS);
  const [payMethod, setPayMethod] = useState<string>("");
  const [receiveMethod, setReceiveMethod] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [createdOrderId, setCreatedOrderId] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitAttempted, setSubmitAttempted] = useState(false);

  const numericAmount = parseAmountInput(amount);
  const debouncedNumericAmount = parseAmountInput(debouncedAmount);
  const amountSettled = amount === debouncedAmount;
  const amountForRates =
    submitAttempted || amountSettled ? numericAmount : debouncedNumericAmount;

  const { rate, loading: ratesLoading, error: ratesError } = useExchangeRates(
    give,
    receive,
    amountSide === "give" && amountForRates > 0 ? amountForRates : undefined
  );

  const giveCurrency = CURRENCY_MAP[give];
  const receiveCurrency = CURRENCY_MAP[receive];

  const payOptions = useMemo(() => paymentOptionsFor("give", give), [give]);
  const receiveOptions = useMemo(
    () => paymentOptionsFor("receive", receive),
    [receive]
  );
  const min = amountSide === "give" ? MIN_AMOUNT[give] : MIN_AMOUNT[receive];

  const conversion = useMemo(() => {
    if (!rate || !debouncedNumericAmount || !amountSettled) return null;
    return applyUahMarkup(
      give,
      receive,
      amountSide,
      debouncedNumericAmount,
      rate
    );
  }, [rate, debouncedNumericAmount, amountSettled, amountSide, give, receive]);

  const swap = () => {
    haptic("medium");
    setGive(receive);
    setReceive(give);
    setPayMethod("");
    setReceiveMethod("");
  };

  const buildFieldErrors = (validatedAmount: number): string[] => {
    const errors: string[] = [];
    if (give === receive) errors.push("Валюти не повинні збігатися");
    if (!validatedAmount) errors.push("Вкажіть суму");
    else if (validatedAmount < min)
      errors.push(
        `Мінімальна сума: ${formatNumber(min)} ${
          amountSide === "give" ? give : receive
        }`
      );
    if (ratesLoading) errors.push("Завантаження курсу…");
    else if (ratesError) errors.push(ratesError);
    else if (!rate) errors.push("Обмін цієї пари тимчасово недоступний");
    return errors;
  };

  const methodErrors: string[] = [];
  if (!payMethod) methodErrors.push("Оберіть спосіб оплати");
  if (!receiveMethod) methodErrors.push("Оберіть спосіб отримання");

  const fieldErrors = buildFieldErrors(numericAmount);
  const isValid = fieldErrors.length === 0 && methodErrors.length === 0;

  const displayErrors = [
    ...((amount.length > 0 && amountSettled) || submitAttempted
      ? buildFieldErrors(
          submitAttempted ? numericAmount : debouncedNumericAmount
        )
      : []),
    ...(submitAttempted ? methodErrors : []),
  ];

  const handleSubmit = async () => {
    setSubmitAttempted(true);
    if (!isValid || submitting) return;
    if (!initData) {
      setSubmitError("Немає даних Telegram. Відкрийте застосунок у Telegram.");
      return;
    }
    setSubmitting(true);
    setSubmitError(null);
    haptic("heavy");

    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Telegram-Init-Data": initData,
        },
        body: JSON.stringify({
          give_currency: give,
          receive_currency: receive,
          amount_side: amountSide,
          amount_input: numericAmount,
          pay_methods: payMethod ? [payMethod] : [],
          receive_method: receiveMethod,
        }),
      });
      const json = (await res.json().catch(() => ({}))) as {
        error?: string;
        id?: string;
      };
      if (!res.ok) {
        setSubmitError(json.error ?? "Не вдалося надіслати заявку");
        return;
      }
      setCreatedOrderId(typeof json.id === "string" ? json.id : null);
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
    return (
      <SuccessScreen
        orderId={createdOrderId}
        onClose={() => {
          setSuccess(false);
          setCreatedOrderId(null);
        }}
      />
    );
  }

  return (
    <div className="px-4 pt-[max(0.75rem,env(safe-area-inset-top,0px))] pb-6 space-y-3">
      <Card className="p-5 space-y-2">
        <div className="grid grid-cols-[1fr_auto_1fr] gap-3">
          <div className="text-center">
            <Label>Віддаю</Label>
          </div>
          <span className="w-10" aria-hidden />
          <div className="text-center">
            <Label>Отримую</Label>
          </div>
        </div>
        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
          <div className="flex justify-center min-w-0">
            <CurrencyButton
              currency={giveCurrency}
              selected
              onClick={() => setPickerOpen("give")}
            />
          </div>
          <button
            type="button"
            onClick={swap}
            aria-label="Поміняти місцями"
            className="shrink-0 w-10 h-10 rounded-full border border-[var(--border-strong)] bg-[var(--bg)] text-[var(--text-muted)] shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] hover:text-[var(--accent)] hover:border-[var(--accent)] hover:bg-[var(--accent-soft)] active:scale-95 transition-all flex items-center justify-center"
          >
            <SwapIcon className="w-[18px] h-[18px]" />
          </button>
          <div className="flex justify-center min-w-0">
            <CurrencyButton
              currency={receiveCurrency}
              selected
              onClick={() => setPickerOpen("receive")}
            />
          </div>
        </div>
      </Card>

      <Card className="p-5 space-y-4">
        <div className="flex items-center">
          <Label>
            Сума в{" "}
            <span className="text-[var(--text)]">
              {amountSide === "give" ? give : receive}
            </span>
          </Label>
        </div>

        <div className="flex items-stretch gap-2">
          <div className="flex items-center px-3 rounded-lg bg-[var(--bg-elevated-2)] border border-[var(--border)] text-xs font-semibold text-[var(--text-muted)] min-w-[58px] justify-center">
            {amountSide === "give" ? give : receive}
          </div>
          <input
            type="text"
            inputMode="decimal"
            placeholder={`Від ${formatNumber(min)}`}
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
            <span className="text-[var(--text-muted)]">До отримання</span>
            <span className="font-mono text-[var(--text)]">
              {formatMoney(
                amountSide === "receive" ? conversion.give : conversion.receive,
                amountSide === "receive" ? give : receive
              )}
            </span>
          </div>
        )}
      </Card>

      <Card className="p-5 space-y-4">
        <div className="flex items-center">
          <Label>Спосіб оплати</Label>
        </div>
        <select
          value={payMethod}
          onChange={(e) => {
            haptic("light");
            setPayMethod(e.target.value);
          }}
          className="w-full h-11 bg-[var(--bg-elevated-2)] border border-[var(--border)] rounded-lg px-3 text-sm text-[var(--text)] focus:outline-none focus:border-[var(--accent)] transition-colors"
        >
          <option value="">Оберіть спосіб оплати</option>
          {payOptions.map((opt) => (
            <option key={opt.id} value={opt.id}>
              {opt.label}
            </option>
          ))}
        </select>
      </Card>

      <Card className="p-5 space-y-4">
        <div className="flex items-center">
          <Label>Спосіб отримання</Label>
        </div>
        <select
          value={receiveMethod}
          onChange={(e) => {
            haptic("light");
            setReceiveMethod(e.target.value);
          }}
          className="w-full h-11 bg-[var(--bg-elevated-2)] border border-[var(--border)] rounded-lg px-3 text-sm text-[var(--text)] focus:outline-none focus:border-[var(--accent)] transition-colors"
        >
          <option value="">Оберіть спосіб отримання</option>
          {receiveOptions.map((opt) => (
            <option key={opt.id} value={opt.id}>
              {opt.label}
            </option>
          ))}
        </select>
      </Card>

      {submitError && (
        <p className="text-[11px] text-[var(--danger)] px-1">{submitError}</p>
      )}

      {displayErrors.length > 0 && (
        <ul className="text-[11px] text-[var(--danger)] space-y-1 px-1">
          {displayErrors.map((e) => (
            <li key={e}>· {e}</li>
          ))}
        </ul>
      )}

      <button
        type="button"
        disabled={fieldErrors.length > 0 || submitting}
        onClick={handleSubmit}
        className="w-full h-12 rounded-lg bg-[var(--accent)] text-[#11151f] font-semibold tracking-tight flex items-center justify-center gap-2 transition-all disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[var(--accent-hover)] active:scale-[0.99]"
      >
        {submitting ? (
          "Надсилання..."
        ) : (
          <>
            Надіслати заявку
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
            setPayMethod("");
          } else {
            setReceive(code);
            setReceiveMethod("");
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

function SuccessScreen({
  orderId,
  onClose,
}: {
  orderId: string | null;
  onClose: () => void;
}) {
  const shortRef =
    orderId && orderId.length >= 8 ? orderId.slice(0, 8).toUpperCase() : null;

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
        Заявку надіслано
      </h2>
      {shortRef && (
        <p className="text-xs font-mono text-[var(--accent)] mb-2">
          № {shortRef}
        </p>
      )}
      <p className="text-sm text-[var(--text-muted)] max-w-xs leading-relaxed mb-7">
        Менеджер зв&apos;яжеться з вами в Telegram протягом 5 хвилин для
        підтвердження обміну.
      </p>
      <button
        type="button"
        onClick={onClose}
        className="h-11 px-6 rounded-lg border border-[var(--border-strong)] text-sm text-[var(--text)] hover:border-[var(--accent)] hover:text-[var(--accent)] transition-colors"
      >
        Створити ще одну
      </button>
    </div>
  );
}
