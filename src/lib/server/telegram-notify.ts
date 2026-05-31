import { paymentOptionLabel } from "@/lib/exchange/data";
import { formatMoney } from "@/lib/exchange/format";
import { config } from "@/lib/config";
import type { CreateOrderPayload } from "@/lib/server/validate-create-order";
import type { TelegramWebAppUser } from "@/lib/server/telegram-web-app";

const API = "https://api.telegram.org";

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function userLabel(user: TelegramWebAppUser): string {
  const name = [user.first_name, user.last_name]
    .filter(Boolean)
    .join(" ")
    .trim();
  const username = user.username ? `@${user.username}` : null;
  const parts = [name || `id ${user.id}`, username].filter(Boolean);
  return escapeHtml(parts.join(" "));
}

export function formatNewOrderMessage(
  orderId: string,
  user: TelegramWebAppUser,
  payload: CreateOrderPayload
): string {
  const payMethods = payload.pay_methods
    .map((id) => escapeHtml(paymentOptionLabel(id)))
    .join(", ");
  const receiveMethod = escapeHtml(paymentOptionLabel(payload.receive_method));

  const lines = [
    "🔔 <b>Нова заявка</b>",
    "",
    `👤 ${userLabel(user)} (<code>${user.id}</code>)`,
    `💱 Віддає: <b>${escapeHtml(
      formatMoney(payload.give_amount, payload.give_currency)
    )}</b>`,
    `💰 Отримує: <b>${escapeHtml(
      formatMoney(payload.receive_amount, payload.receive_currency)
    )}</b>`,
    `📈 Курс: ${payload.rate}`,
    `💳 Оплата: ${payMethods}`,
    `📥 Отримання: ${receiveMethod}`,
    `🆔 <code>${escapeHtml(orderId)}</code>`,
  ];

  const adminUrl = `${config.app.miniAppUrl}/admin`;
  lines.push("", `🛠 <a href="${adminUrl}">Панель модератора</a>`);

  return lines.join("\n");
}

/**
 * Sends a notification to the moderator (user or group) about a new order.
 * Silently no-ops if notifications are not configured. Never throws.
 */
export async function sendModeratorNotification(text: string): Promise<void> {
  const token = process.env.TELEGRAM_BOT_TOKEN?.trim();
  const chatId = process.env.TELEGRAM_MODERATOR_CHAT_ID?.trim();
  if (!token || !chatId) return;

  try {
    const res = await fetch(`${API}/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: "HTML",
        disable_web_page_preview: true,
      }),
    });

    if (!res.ok) {
      console.error(
        "Telegram notify failed:",
        res.status,
        await res.text().catch(() => "")
      );
    }
  } catch (err) {
    console.error("Telegram notify error:", err);
  }
}
