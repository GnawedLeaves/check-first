import { downloadWhatsAppImage, sendWhatsAppMessage } from "../utils/whatsapp";
import { detectAI } from "./aiDetection";
import { scanMetadata } from "./metadataScan";
import { composeVerdict } from "./verdict";

export async function handleWebhook(body: any): Promise<void> {
  const entry = body.entry?.[0]?.changes?.[0]?.value;
  const message = entry?.messages?.[0];

  if (!message || message.type !== "image") return;

  const to: string = message.from;
  const mediaId: string = message.image.id;

  try {
    await sendWhatsAppMessage(to, "🔍 Scanning image... please wait.");

    const imageBuffer = await downloadWhatsAppImage(mediaId);

    const [aiResult, metaResult] = await Promise.all([
      detectAI(imageBuffer),
      scanMetadata(imageBuffer),
    ]);

    const reply = composeVerdict(aiResult, metaResult);
    await sendWhatsAppMessage(to, reply);
  } catch (err) {
    console.error("Pipeline error:", err);
    await sendWhatsAppMessage(
      to,
      "⚠️ Sorry, I could not scan that image. Please try again.",
    );
  }
}
