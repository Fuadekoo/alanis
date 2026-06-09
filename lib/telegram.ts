import { Bot } from "grammy";

declare global {
  // eslint-disable-next-line no-var
  var telegramSender: Bot | undefined;
}

export type TelegramSendResult = {
  ok: boolean;
  error?: string;
};

function getTelegramBot(): Bot | null {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) return null;

  if (globalThis.bot) return globalThis.bot;

  if (!globalThis.telegramSender) {
    globalThis.telegramSender = new Bot(token);
  }

  return globalThis.telegramSender;
}

function escapeHtml(text: string) {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function isValidHttpUrl(url: string) {
  try {
    const parsed = new URL(url.trim());
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

export async function sendTelegramMessage(
  chatId: string,
  text: string,
  options?: Parameters<Bot["api"]["sendMessage"]>[2]
): Promise<TelegramSendResult> {
  if (!chatId?.trim()) {
    return { ok: false, error: "Missing Telegram chat ID" };
  }

  const bot = getTelegramBot();
  if (!bot) {
    return { ok: false, error: "Telegram bot is not configured" };
  }

  try {
    await bot.api.sendMessage(chatId, text, options);
    return { ok: true };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to send Telegram message";
    console.error("Failed to send Telegram message:", error);
    return { ok: false, error: message };
  }
}

export type RoomLinkNotificationParams = {
  chatId: string;
  link: string;
  studentName: string;
  teacherName: string;
  greeting: string;
  displayTime: string;
  duration: number;
};

export async function sendRoomLinkNotification({
  chatId,
  link,
  studentName,
  teacherName,
  greeting,
  displayTime,
  duration,
}: RoomLinkNotificationParams): Promise<TelegramSendResult> {
  const trimmedLink = link.trim();

  const message =
    `📚 <b>የክፍል ሊንክ ደርሶዎታል!</b>\n\n` +
    `${escapeHtml(greeting)} <b>${escapeHtml(studentName)}</b>\n\n` +
    `👨‍🏫 መምህር: <b>${escapeHtml(teacherName)}</b>\n` +
    `🕐 ሰዓት: <b>${escapeHtml(displayTime)}</b>\n` +
    `⏱ ቆይታ: <b>${duration} ደቂቃ</b>\n\n` +
    `ከታች ያለውን ቁልፍ በመጫን ወደ ክፍልዎ ይግቡ 👇`;

  if (isValidHttpUrl(trimmedLink)) {
    return sendTelegramMessage(chatId, message, {
      parse_mode: "HTML",
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: "📖 ወደ ክፍል ይግቡ / Join Class",
              url: trimmedLink,
            },
          ],
        ],
      },
    });
  }

  return sendTelegramMessage(
    chatId,
    `${message}\n\n🔗 ${escapeHtml(trimmedLink)}`,
    { parse_mode: "HTML" }
  );
}
