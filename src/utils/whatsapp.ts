import axios from "axios";

export async function downloadWhatsAppImage(mediaId: string): Promise<Buffer> {
  try {
    // Step 1: get the temporary CDN URL
    console.log(`Fetching CDN URL for media ID: ${mediaId}`);
    const urlRes = await axios.get(
      `https://graph.facebook.com/v19.0/${mediaId}`,
      { headers: { Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}` } },
    );
    const mediaUrl: string = urlRes.data.url;
    console.log("CDN URL obtained, downloading image...");

    // Step 2: download the actual bytes
    const imgRes = await axios.get(mediaUrl, {
      responseType: "arraybuffer",
      headers: { Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}` },
    });
    console.log(
      `Image downloaded successfully: ${imgRes.data.byteLength} bytes`,
    );
    return Buffer.from(imgRes.data);
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error("Image download error:", err);
    throw new Error(`Failed to download image: ${errorMsg}`);
  }
}

export async function sendWhatsAppMessage(
  to: string,
  text: string,
): Promise<void> {
  try {
    console.log(`Sending WhatsApp message to ${to}...`);
    await axios.post(
      `https://graph.facebook.com/v19.0/${process.env.PHONE_NUMBER_ID}/messages`,
      { messaging_product: "whatsapp", to, type: "text", text: { body: text } },
      { headers: { Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}` } },
    );
    console.log(`Message sent successfully to ${to}`);
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error("Send message error:", err);
    throw new Error(`Failed to send WhatsApp message: ${errorMsg}`);
  }
}
