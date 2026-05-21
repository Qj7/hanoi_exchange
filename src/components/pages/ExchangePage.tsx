"use client";

import { useMemo, useState } from "react";
import { MIN_AMOUNT } from "@/lib/exchange/constants";
import {
  CURRENCY_MAP,
  paymentOptionsFor,
  type CurrencyCode,
} from "@/lib/exchange/data";
import { useExchangeRates } from "@/lib/exchange/use-rates";
import {
  formatMoney,
  formatNumber,
  formatRateQuote,
} from "@/lib/exchange/format";
import { Card } from "@/components/ui/Card";
import { CurrencyButton } from "@/components/exchange/CurrencyButton";
import { CurrencyPicker } from "@/components/exchange/CurrencyPicker";
import { ArrowRightIcon, SwapIcon } from "@/components/icons";
import { useTelegram } from "@/lib/telegram/TelegramProvider";

type Side = "give" | "receive";

export function ExchangePage() {
  const { haptic, webApp, initData } = useTelegram();

  const [give, setGive] = useState<CurrencyCode>("UAH");
  const [receive, setReceive] = useState<CurrencyCode>("VND");
  const [pickerOpen, setPickerOpen] = useState<Side | null>(null);
  const [amountSide] = useState<Side>("give");
  const [amount, setAmount] = useState<string>("");
  const [payMethod, setPayMethod] = useState<string>("");
  const [receiveMethod, setReceiveMethod] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [createdOrderId, setCreatedOrderId] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitAttempted, setSubmitAttempted] = useState(false);

  const { rate, loading: ratesLoading, error: ratesError } = useExchangeRates(
    give,
    receive
  );

  const giveCurrency = CURRENCY_MAP[give];
  const receiveCurrency = CURRENCY_MAP[receive];

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
    setPayMethod("");
    setReceiveMethod("");
  };

  const fieldErrors: string[] = [];
  if (give === receive) fieldErrors.push("Валюты не должны совпадать");
  if (!numericAmount) fieldErrors.push("Укажите сумму");
  else if (numericAmount < min)
    fieldErrors.push(
      `Минимальная сумма: ${formatNumber(min)} ${
        amountSide === "give" ? give : receive
      }`
    );
  if (ratesLoading) fieldErrors.push("Загрузка курса…");
  else if (ratesError) fieldErrors.push(ratesError);
  else if (!rate) fieldErrors.push("Обмен этой пары временно недоступен");

  const methodErrors: string[] = [];
  if (!payMethod) methodErrors.push("Выберите способ оплаты");
  if (!receiveMethod) methodErrors.push("Выберите способ получения");

  const isValid = fieldErrors.length === 0 && methodErrors.length === 0;

  const displayErrors = [
    ...(amount.length > 0 || submitAttempted ? fieldErrors : []),
    ...(submitAttempted ? methodErrors : []),
  ];

  const handleSubmit = async () => {
    setSubmitAttempted(true);
    if (!isValid || submitting) return;
    if (!initData) {
      setSubmitError("Нет данных Telegram. Откройте приложение в Telegram.");
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
        setSubmitError(json.error ?? "Не удалось отправить заявку");
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
      <RateBanner
        from={give}
        to={receive}
        rate={rate}
        loading={ratesLoading}
        error={ratesError}
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
        <div className="flex items-center">
          <Label>
            Сумма в{" "}
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

      <Card className="p-5 space-y-4">
        <div className="flex items-center">
          <Label>Способ оплаты</Label>
        </div>
        <select
          value={payMethod}
          onChange={(e) => {
            haptic("light");
            setPayMethod(e.target.value);
          }}
          className="w-full h-11 bg-[var(--bg-elevated-2)] border border-[var(--border)] rounded-lg px-3 text-sm text-[var(--text)] focus:outline-none focus:border-[var(--accent)] transition-colors"
        >
          <option value="">Выберите способ оплаты</option>
          {payOptions.map((opt) => (
            <option key={opt.id} value={opt.id}>
              {opt.label}
            </option>
          ))}
        </select>
      </Card>

      <Card className="p-5 space-y-4">
        <div className="flex items-center">
          <Label>Способ получения</Label>
        </div>
        <select
          value={receiveMethod}
          onChange={(e) => {
            haptic("light");
            setReceiveMethod(e.target.value);
          }}
          className="w-full h-11 bg-[var(--bg-elevated-2)] border border-[var(--border)] rounded-lg px-3 text-sm text-[var(--text)] focus:outline-none focus:border-[var(--accent)] transition-colors"
        >
          <option value="">Выберите способ получения</option>
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

function RateBanner({
  from,
  to,
  rate,
  loading,
  error,
}: {
  from: CurrencyCode;
  to: CurrencyCode;
  rate: number | null;
  loading: boolean;
  error: string | null;
}) {
  const quote =
    rate != null && rate > 0 ? formatRateQuote(from, to, rate) : null;

  return (
    <div className="flex items-center justify-between px-4 py-2.5 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border)]">
      <span className="text-[11px] uppercase tracking-[0.14em] text-[var(--text-dim)]">
        Курс Binance P2P
      </span>
      {loading ? (
        <span className="text-xs text-[var(--text-muted)]">Загрузка…</span>
      ) : error ? (
        <span className="text-xs text-[var(--danger)]">Недоступен</span>
      ) : quote ? (
        <div className="flex items-center gap-2 font-mono text-xs">
          <span className="text-[var(--text-muted)]">{quote.fromLabel}</span>
          <ArrowRightIcon className="w-3 h-3 text-[var(--text-dim)]" />
          <span className="text-[var(--accent)] font-semibold">
            {quote.toLabel}
          </span>
        </div>
      ) : (
        <span className="text-xs text-[var(--text-muted)]">—</span>
      )}
    </div>
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
        Заявка отправлена
      </h2>
      {shortRef && (
        <p className="text-xs font-mono text-[var(--accent)] mb-2">
          № {shortRef}
        </p>
      )}
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
