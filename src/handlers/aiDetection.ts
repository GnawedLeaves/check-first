import axios from "axios";

export interface AIDetectionResult {
  score: number; // 0–1, probability of being AI-generated
  label: "ai" | "real" | "uncertain";
}

export async function detectAI(
  imageBuffer: Buffer,
): Promise<AIDetectionResult> {
  const formData = new FormData();
  formData.append("image", new Uint8Array(imageBuffer) as any, "image.jpg");

  const res = await axios.post(
    "https://api.thehive.ai/api/v2/task/sync",
    formData,
    {
      headers: {
        Authorization: `Token ${process.env.HIVE_API_KEY}`,
        "Content-Type": "multipart/form-data",
      },
      params: { model: "ai-generated-image" },
    },
  );

  const classes = res.data.status[0].response.output[0].classes;
  const aiClass = classes.find((c: any) => c.class === "ai_generated");
  const score: number = aiClass?.score ?? 0;

  return {
    score,
    label: score > 0.75 ? "ai" : score > 0.4 ? "uncertain" : "real",
  };
}
