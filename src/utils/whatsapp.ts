import axios from "axios";

export async function downloadWhatsAppImage(mediaId: string): Promise<Buffer> {
  // Step 1: get the temporary CDN URL
  const urlRes = await axios.get(
    `https://graph.facebook.com/v19.0/${mediaId}`,
    { headers: { Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}` } },
  );
  const mediaUrl: string = urlRes.data.url;

  // Step 2: download the actual bytes
  const imgRes = await axios.get(mediaUrl, {
    responseType: "arraybuffer",
    headers: { Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}` },
  });
  return Buffer.from(imgRes.data);
}

export async function sendWhatsAppMessage(
  to: string,
  text: string,
): Promise<void> {
  await axios.post(
    `https://graph.facebook.com/v19.0/${process.env.PHONE_NUMBER_ID}/messages`,
    { messaging_product: "whatsapp", to, type: "text", text: { body: text } },
    { headers: { Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}` } },
  );
}
