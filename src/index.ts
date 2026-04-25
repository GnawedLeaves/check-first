import express from 'express';
import { handleWebhook } from "./handlers/ imageHandler.ts";

const app = express();
app.use(express.json());

const VERIFY_TOKEN = process.env.VERIFY_TOKEN!;

// Meta webhook verification (one-time handshake)
app.get('/webhook', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];
  if (mode === 'subscribe' && token === VERIFY_TOKEN) {
    res.status(200).send(challenge);
  } else {
    res.sendStatus(403);
  }
});

// Incoming messages
app.post('/webhook', async (req, res) => {
  res.sendStatus(200); // ACK immediately — Meta requires < 5s response
  await handleWebhook(req.body);
});

app.listen(3000, () => console.log('ScamShield Vision running on :3000'));