import axios from "axios";
import { detectAI } from "../handlers/aiDetection.js";
import { scanMetadata } from "../handlers/metadataScan.js";
import { composeVerdict } from "../handlers/verdict.js";
import {
  saveImageResult,
  getStatsForChat,
  getGlobalStats,
} from "./database.js";
import TelegramBot from "node-telegram-bot-api";

const TOKEN = process.env.TELEGRAM_BOT_TOKEN!;

export function initTelegramBot(): TelegramBot {
  const bot = new TelegramBot(TOKEN, { polling: false });

  bot.on("photo", async (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from?.id || 0;

    try {
      await bot.sendMessage(
        chatId,
        "🔍 Chickens are pecking your image... please wait...",
      );

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

      // Save result to Firebase
      await saveImageResult({
        chatId,
        userId,
        isAI: aiResult.label === "ai",
        aiScore: aiResult.score,
        label: aiResult.label,
        hasC2PA: metaResult.hasC2PA,
        softwareTag: metaResult.softwareTag,
        createdAt: new Date(),
        source: "telegram",
      });

      // Send verdict — parse_mode Markdown renders *bold* and _italic_
      await bot.sendMessage(chatId, verdict, { parse_mode: "Markdown" });
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      const errorStack = err instanceof Error ? err.stack : "";
      console.error("Telegram pipeline error:", errorMsg, errorStack);
      await bot.sendMessage(chatId, `⚠️ Error scanning image:\n\n${errorMsg}`);
    }
  });

  // Handle documents — users sometimes send images as files (uncompressed)
  bot.on("document", async (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from?.id || 0;
    const doc = msg.document!;

    // Only handle image documents
    if (!doc.mime_type?.startsWith("image/")) {
      await bot.sendMessage(chatId, "Please send an image file for scanning.");
      return;
    }

    try {
      await bot.sendMessage(
        chatId,
        "🔍 Chickens are pecking your image... please wait...",
      );

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

      // Save result to Firebase
      await saveImageResult({
        chatId,
        userId,
        isAI: aiResult.label === "ai",
        aiScore: aiResult.score,
        label: aiResult.label,
        hasC2PA: metaResult.hasC2PA,
        softwareTag: metaResult.softwareTag,
        createdAt: new Date(),
        source: "telegram",
      });

      await bot.sendMessage(chatId, verdict, { parse_mode: "Markdown" });
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      const errorStack = err instanceof Error ? err.stack : "";
      console.error("Telegram document error:", errorMsg, errorStack);
      await bot.sendMessage(chatId, `⚠️ Error scanning file:\n\n${errorMsg}`);
    }
  });

  // Welcome message
  bot.onText(/\/start/, async (msg) => {
    try {
      await bot.sendMessage(
        msg.chat.id,
        `👋 *Welcome to Check First Lah Bot*\n\n` +
          `Send or forward any image and our chicken on duty will tell you:\n` +
          `• If it looks AI-generated\n` +
          `• If it carries AI tool signatures\n` +
          `• If you should trust it\n\n` +
          `_Forward images directly from other chats or upload an image. 🐓_\n\n` +
          `Chickens on duty:\n1. Snowie 🐔☃️\n2. Queenie 🐔👑`,
        { parse_mode: "Markdown" },
      );
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      const errorStack = err instanceof Error ? err.stack : "";
      console.error("Start command error:", errorMsg, errorStack);
    }
  });

  // Stats command
  bot.onText(/\/stats/, async (msg) => {
    const chatId = msg.chat.id;

    try {
      const stats = await getStatsForChat(chatId);
      const globalStats = await getGlobalStats();

      const message =
        `📊 *Your Personal Stats*\n\n` +
        `Total Scans: *${stats.total}*\n` +
        `🤖 AI-Generated: *${stats.aiGenerated}* (${stats.aiPercentage}%)\n` +
        `✅ Real Images: *${stats.real}*\n` +
        `⚠️ Uncertain: *${stats.uncertain}*\n\n` +
        `📈 *Global Community Stats*\n\n` +
        `Total Images Scanned: *${globalStats.totalImages}*\n` +
        `🤖 AI-Generated: *${globalStats.aiGeneratedCount}* (${globalStats.aiPercentage}%)\n` +
        `✅ Real Images: *${globalStats.realCount}*\n` +
        `⚠️ Uncertain: *${globalStats.uncertainCount}*\n` +
        `👥 Active Users: *${globalStats.uniqueUsers}*`;

      await bot.sendMessage(chatId, message, { parse_mode: "Markdown" });
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      const errorStack = err instanceof Error ? err.stack : "";
      console.error("Stats error:", errorMsg, errorStack);
      await bot.sendMessage(chatId, `⚠️ Could not fetch stats:\n\n${errorMsg}`);
    }
  });

  return bot;
}
