import {
  downloadWhatsAppImage,
  sendWhatsAppMessage,
} from "../utils/whatsapp.js";
import { detectAI } from "./aiDetection.js";
import { scanMetadata } from "./metadataScan.js";
import { composeVerdict } from "./verdict.js";

export async function handleWebhook(body: any): Promise<void> {
  const entry = body.entry?.[0]?.changes?.[0]?.value;
  const message = entry?.messages?.[0];

  if (!message || message.type !== "image") return;

  const to: string = message.from;
  const mediaId: string = message.image.id;

  try {
    await sendWhatsAppMessage(to, "🔍 Scanning image... please wait.");

    await sendWhatsAppMessage(to, "📥 Downloading image from WhatsApp...");
    const imageBuffer = await downloadWhatsAppImage(mediaId);
    await sendWhatsAppMessage(
      to,
      `✅ Image downloaded (${imageBuffer.length} bytes)`,
    );

    await sendWhatsAppMessage(to, "🤖 Analyzing for AI generation...");
    const aiResult = await detectAI(imageBuffer);
    await sendWhatsAppMessage(
      to,
      `✅ AI analysis complete (${Math.round(aiResult.score * 100)}% confidence)`,
    );

    await sendWhatsAppMessage(to, "🔍 Scanning image metadata...");
    const metaResult = await scanMetadata(imageBuffer);
    await sendWhatsAppMessage(to, "✅ Metadata scan complete");

    await sendWhatsAppMessage(to, "📊 Composing final verdict...");
    const reply = composeVerdict(aiResult, metaResult);
    await sendWhatsAppMessage(to, reply);
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    const stack = err instanceof Error ? err.stack : "";
    console.error("Pipeline error:", err);
    await sendWhatsAppMessage(
      to,
      `❌ Error in pipeline:\n\n${errorMessage}\n\n${stack}`,
    );
  }
}
