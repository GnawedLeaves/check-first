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

    console.log("Calling The Hive AI API...");
    console.log(
      `Using API key: ${process.env.HIVE_API_KEY?.substring(0, 8)}...`,
    );

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
    console.log("The Hive API response received");

    const outputs = data.output?.[0];
    if (!outputs) {
      throw new Error("No output data from The Hive API");
    }

    const aiScore = outputs.predictions?.ai_generated_and_deepfake_content ?? 0;
    const score: number = aiScore;

    console.log(`AI Detection score: ${score}`);
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
