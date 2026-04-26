import type { AIDetectionResult } from "./aiDetection.js";
import type { MetadataResult } from "./metadataScan.js";

export function composeVerdict(
  ai: AIDetectionResult,
  meta: MetadataResult,
): string {
  const pct = Math.round(ai.score * 100);

  if (ai.label === "ai" || meta.hasC2PA) {
    return (
      `🚨 *CheckFirstLah Warning*\n\n` +
      `This image looks *super fake*.\n` +
      `AI probability: *${pct}%*\n` +
      (meta.hasC2PA
        ? `🔍 Detected: Created by AI software${meta.softwareTag ? ` (${meta.softwareTag})` : ""}\n`
        : "") +
      `\n⛔ *Be careful to not send money or believe in this slop*\n` +
      `\nIt could be a scam!!!` +
      `\n\n_Made by marcel (https://marcelyap.dev/)_`
    );
  }

  if (ai.label === "uncertain") {
    return (
      `⚠️ *CheckFirstLah Notice*\n\n` +
      `This image *may* have been edited or AI-generated.\n` +
      `AI probability: *${pct}%*\n` +
      (meta.isStripped
        ? `📦 Note: Image was compressed, some checks were limited.\n`
        : "") +
      `\nBe cautious. Verify through other means before trusting this image.`
    );
  }

  return (
    `✅ *CheckFirstLah: No issues found*\n\n` +
    `AI probability: *${pct}%*\n` +
    `This image seems legit you can trust it but it could still be photoshopped.\n\n` +
    `_If you are unsure about any image, send them here!_` +
    `\n\n_Made by marcel (https://marcelyap.dev/)_`
  );
}
