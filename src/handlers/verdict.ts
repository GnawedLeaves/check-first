import type { AIDetectionResult } from "./aiDetection.js";
import type { MetadataResult } from "./metadataScan.js";

export function composeVerdict(
  ai: AIDetectionResult,
  meta: MetadataResult,
): string {
  const pct = Math.round(ai.score * 100);

  const chickensOnDuty = ["Snowie", "Queenie"];
  const randomIndex = Math.floor(Math.random() * 2);
  const chicken = chickensOnDuty[randomIndex];

  if (ai.label === "ai" || meta.hasC2PA) {
    return (
      `🚨 *SQUAWK! ${chicken} says there's something FOWL!* 🚨\n\n` +
      `This image looks *cluckin' fake*! 🍗\n` +
      `AI probability: *${pct}%*\n` +
      (meta.hasC2PA
        ? `🪶 *Egg-spert Evidence:* Created by AI software${meta.softwareTag ? ` (${meta.softwareTag})` : ""}\n`
        : "") +
      `\n⛔ *Don't be a coo coo!* Do not send money or believe this AI-generated slop.\n` +
      `\n\n_Hatched by marcel (https://marcelyap.dev/)_`
    );
  }

  if (ai.label === "uncertain") {
    return (
      `⚠️ *Something's Smellin' Fowl...* ⚠️\n\n` +
      `${chicken} scratching my head on this one. It *might* be AI-generated.\n` +
      `AI probability: *${pct}%*\n` +
      (meta.isStripped
        ? `📦 *Note:* Metadata was stripped. Hard to see through the coop! \n`
        : "") +
      `\nBe cautious, check again before you trust this image!`
    );
  }

  return (
    `✅ *${chicken}🐔 says it looks Egg-cellent!* ✅\n\n` +
    `AI probability: *${pct}%*\n` +
    `This image seems legit! No _fowl_ play detected, though it could still be a sneaky photoshop pok pok.\n\n` +
    `_If you find more suspicious slop, send them to the chickies!_` +
    `\n\n_Hatched by marcel (https://marcelyap.dev/)_`
  );
}
