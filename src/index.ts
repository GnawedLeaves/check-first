import express from "express";
import { handleWebhook } from "./handlers/imageHandler.js";

const app = express();
app.use(express.json());

const VERIFY_TOKEN = process.env.VERIFY_TOKEN!;

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

app.get("/", (req, res) => {
  res.send("🚀 ScamShield Vision Server is online!");
});
app.listen(3000, () => console.log("ScamShield Vision running on :3000"));
