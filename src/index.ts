import express from "express";
import { handleWebhook } from "./handlers/imageHandler.js";
import { initTelegramBot } from "./utils/telegram.js";

const app = express();
app.use(express.json());

const VERIFY_TOKEN = process.env.VERIFY_TOKEN!;
const TELEGRAM_TOKEN = process.env.TELEGRAM_BOT_TOKEN!;

// Meta webhook verification (one-time handshake)
app.get("/webhook", (req, res) => {
  console.log("Webhook verification request received");
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];
  if (mode === "subscribe" && token === VERIFY_TOKEN) {
    console.log("✅ Webhook verified successfully");
    res.status(200).send(challenge);
  } else {
    console.log("❌ Webhook verification failed: invalid token");
    res.sendStatus(403);
  }
});

// Incoming messages
app.post("/webhook", async (req, res) => {
  console.log("📨 Incoming webhook received");
  res.sendStatus(200); // ACK immediately — Meta requires < 5s response
  handleWebhook(req.body).catch((err) => {
    console.error("Unhandled webhook error:", err);
  });
});

//Telegram bot
const bot = initTelegramBot();

app.post(`/telegram/${TELEGRAM_TOKEN}`, (req, res) => {
  bot.processUpdate(req.body);
  res.sendStatus(200);
});

app.get("/", (req, res) => {
  res.status(200).json({ status: "CheckFirstLah Vision is running" });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, async () => {
  console.log(`CheckFirstLah Vision running on :${PORT}`);

  // Register Telegram webhook on startup
  const webhookUrl = `https://${process.env.RENDER_EXTERNAL_HOSTNAME}/telegram/${TELEGRAM_TOKEN}`;
  await bot.setWebHook(webhookUrl);
  console.log(`Telegram webhook set: ${webhookUrl}`);
});

app.listen(3000, () => console.log("CheckFirstLah Vision running on :3000"));
