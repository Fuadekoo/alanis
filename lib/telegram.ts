import { Bot } from "grammy";

declare global {
  // eslint-disable-next-line no-var
  var bot: Bot | undefined;
  // eslint-disable-next-line no-var
  var telegramSender: Bot | undefined;
}

function getTelegramBot(): Bot | null {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) return null;

  if (global.bot) return global.bot;

  if (!global.telegramSender) {
    global.telegramSender = new Bot(token);
  }

  return global.telegramSender;
}

export async function sendTelegramMessage(
  chatId: string,
  text: string,
  options?: Parameters<Bot["api"]["sendMessage"]>[2]
) {
  if (!chatId?.trim()) return;

  const bot = getTelegramBot();
  if (!bot) return;

  try {
    await bot.api.sendMessage(chatId, text, options);
  } catch (error) {
    console.error("Failed to send Telegram message:", error);
  }
}
