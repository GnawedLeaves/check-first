import axios from "axios";
import { detectAI } from "../handlers/aiDetection.js";
import { scanMetadata } from "../handlers/metadataScan.js";
import { composeVerdict } from "../handlers/verdict.js";
import TelegramBot from "node-telegram-bot-api";

const TOKEN = process.env.TELEGRAM_BOT_TOKEN!;

export function initTelegramBot(): TelegramBot {
  const bot = new TelegramBot(TOKEN, { polling: false });

  bot.on("photo", async (msg) => {
    const chatId = msg.chat.id;

    try {
      await bot.sendMessage(chatId, "🔍 Scanning image... please wait.");

      // Telegram sends multiple sizes — always take the last (highest res)
      const photos = msg.photo!;
      const fileId = photos?.[photos.length - 1]?.file_id;

      // Get the download URL from Telegram
      const fileInfo = await bot.getFile(fileId ?? "");
      const fileUrl = `https://api.telegram.org/file/bot${TOKEN}/${fileInfo.file_path}`;

      // Download image bytes
      const response = await axios.get(fileUrl, {
        responseType: "arraybuffer",
      });
      const imageBuffer = Buffer.from(response.data);

      // Run the same pipeline as WhatsApp
      const [aiResult, metaResult] = await Promise.all([
        detectAI(imageBuffer),
        scanMetadata(imageBuffer),
      ]);

      const verdict = composeVerdict(aiResult, metaResult);

      // Send verdict — parse_mode Markdown renders *bold* and _italic_
      await bot.sendMessage(chatId, verdict, { parse_mode: "Markdown" });
    } catch (err) {
      console.error("Telegram pipeline error:", err);
      await bot.sendMessage(
        chatId,
        "⚠️ Sorry, I could not scan that image. Please try again.",
      );
    }
  });

  // Handle documents — users sometimes send images as files (uncompressed)
  bot.on("document", async (msg) => {
    const chatId = msg.chat.id;
    const doc = msg.document!;

    // Only handle image documents
    if (!doc.mime_type?.startsWith("image/")) {
      await bot.sendMessage(chatId, "Please send an image file for scanning.");
      return;
    }

    try {
      await bot.sendMessage(chatId, "🔍 Scanning image... please wait.");

      const fileInfo = await bot.getFile(doc.file_id);
      const fileUrl = `https://api.telegram.org/file/bot${TOKEN}/${fileInfo.file_path}`;

      const response = await axios.get(fileUrl, {
        responseType: "arraybuffer",
      });
      const imageBuffer = Buffer.from(response.data);

      const [aiResult, metaResult] = await Promise.all([
        detectAI(imageBuffer),
        scanMetadata(imageBuffer),
      ]);

      const verdict = composeVerdict(aiResult, metaResult);
      await bot.sendMessage(chatId, verdict, { parse_mode: "Markdown" });
    } catch (err) {
      console.error("Telegram document error:", err);
      await bot.sendMessage(
        chatId,
        "⚠️ Could not scan that file. Try sending as a photo instead.",
      );
    }
  });

  // Welcome message
  bot.onText(/\/start/, async (msg) => {
    await bot.sendMessage(
      msg.chat.id,
      `👋 *Welcome to CheckFirstLah Bot *\n\n` +
        `Send me any image and I'll tell you:\n` +
        `• If looks AI-generated\n` +
        `• If it carries AI tool signatures\n` +
        `• If you should trust it\n\n` +
        `_Forward images directly from other chats or upload an image. :D_`,
      { parse_mode: "Markdown" },
    );
  });

  return bot;
}
