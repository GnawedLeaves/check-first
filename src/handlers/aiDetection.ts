import axios from "axios";

export interface AIDetectionResult {
  score: number; // 0–1, probability of being AI-generated
  label: "ai" | "real" | "uncertain";
}

export async function detectAI(
  imageBuffer: Buffer,
): Promise<AIDetectionResult> {
  try {
    const base64Image = imageBuffer.toString("base64");

    const res = await fetch(
      "https://api.thehive.ai/api/v3/hive/ai-generated-and-deepfake-content-detection",
      {
        method: "POST",
        headers: {
          authorization: `Bearer ${process.env.HIVE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          media_metadata: true,
          input: [{ media_base64: `data:image/jpeg;base64,${base64Image}` }],
        }),
      },
    );

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    }

    const data: any = await res.json();

    const outputs = data.output?.[0];
    if (!outputs || !outputs.classes) {
      throw new Error("No output data from The Hive API");
    }

    // Find the ai_generated class in the response
    const aiClass = outputs.classes.find(
      (c: any) => c.class === "ai_generated",
    );
    const score: number = aiClass?.value ?? 0;

    return {
      score,
      label: score > 0.75 ? "ai" : score > 0.4 ? "uncertain" : "real",
    };
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error("AI Detection error:", err);
    throw new Error(`AI Detection failed: ${errorMsg}`);
  }
}
