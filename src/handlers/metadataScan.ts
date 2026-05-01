import sharp from "sharp";
import * as exifr from "exifr";

export interface MetadataResult {
  hasC2PA: boolean;
  softwareTag: string | null; // e.g. "DALL-E 3", "Adobe Firefly"
  isStripped: boolean; // true = WA compression removed metadata
  rawExif: Record<string, any>;
}

const AI_GENERATORS = [
  "dall-e",
  "firefly",
  "midjourney",
  "stable diffusion",
  "gemini",
  "ideogram",
  "runway",
  "synthid",
];

export async function scanMetadata(
  imageBuffer: Buffer,
): Promise<MetadataResult> {
  try {
    let rawExif: Record<string, any> = {};
    let softwareTag: string | null = null;
    let hasC2PA = false;

    try {
      rawExif =
        (await exifr.parse(imageBuffer, {
          xmp: true,
          iptc: true,
          icc: true,
        })) ?? {};

      // Check Software tag — AI tools often sign their output
      const software = rawExif.Software?.toLowerCase() ?? "";
      softwareTag = rawExif.Software ?? null;
      hasC2PA = "dc:provenance" in rawExif || "c2pa" in rawExif;

      // Detect known AI generator signatures in software tag
      if (AI_GENERATORS.some((gen) => software.includes(gen))) {
        hasC2PA = true; // treat as provenance signal even without formal C2PA
      }
    } catch (parseErr) {
      // exifr throws on stripped images — that's fine, flag it
    }

    const isStripped = Object.keys(rawExif).length < 3;

    return { hasC2PA, softwareTag, isStripped, rawExif };
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error("Metadata scan error:", err);
    throw new Error(`Metadata scan failed: ${errorMsg}`);
  }
}
