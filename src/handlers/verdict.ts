import type { AIDetectionResult } from "./aiDetection.js";
import type { MetadataResult } from "./metadataScan.js";

export function composeVerdict(
  ai: AIDetectionResult,
  meta: MetadataResult,
): string {
  const pct = Math.round(ai.score * 100);

  if (ai.label === "ai" || meta.hasC2PA) {
    return (
      `🚨 *ScamShield Warning*\n\n` +
      `This image looks *artificial*.\n` +
      `AI probability: *${pct}%*\n` +
      (meta.hasC2PA
        ? `🔍 Detected: Created by AI software${meta.softwareTag ? ` (${meta.softwareTag})` : ""}\n`
        : "") +
      `\n⛔ *Do NOT send money or personal information based on this image.*\n` +
      `If someone sent you this, they may be trying to trick you.`
    );
  }

  if (ai.label === "uncertain") {
    return (
      `⚠️ *ScamShield Notice*\n\n` +
      `This image *may* have been edited or AI-generated.\n` +
      `AI probability: *${pct}%*\n` +
      (meta.isStripped
        ? `📦 Note: Image was compressed, some checks were limited.\n`
        : "") +
      `\nBe cautious. Verify through other means before trusting this image.`
    );
  }

  return (
    `✅ *ScamShield: No issues found*\n\n` +
    `AI probability: *${pct}%*\n` +
    `This image appears to be real.\n\n` +
    `_Always stay alert — forward suspicious images here anytime._`
  );
}
