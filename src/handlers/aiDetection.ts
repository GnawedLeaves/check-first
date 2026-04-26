import axios from "axios";

export interface AIDetectionResult {
  score: number; // 0–1, probability of being AI-generated
  label: "ai" | "real" | "uncertain";
}

export async function detectAI(
  imageBuffer: Buffer,
): Promise<AIDetectionResult> {
  try {
    const formData = new FormData();
    const blob = new Blob([new Uint8Array(imageBuffer)], {
      type: "image/jpeg",
    });
    formData.append("image", blob, "image.jpg");

    console.log("Calling The Hive AI API...");
    console.log(
      `Using API key: ${process.env.HIVE_API_KEY?.substring(0, 8)}...`,
    );
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

    console.log("The Hive API response received");
    const classes = res.data.status[0].response.output[0].classes;
    const aiClass = classes.find((c: any) => c.class === "ai_generated");
    const score: number = aiClass?.score ?? 0;

    console.log(`AI Detection score: ${score}`);
    return {
      score,
      label: score > 0.75 ? "ai" : score > 0.4 ? "uncertain" : "real",
    };
  } catch (err) {
    let errorMsg = "Unknown error";
    if (axios.isAxiosError(err)) {
      errorMsg = `HTTP ${err.response?.status}: ${err.response?.statusText || "Unknown"} - ${JSON.stringify(err.response?.data || "No response data")}`;
      console.error("The Hive API error response:", {
        status: err.response?.status,
        statusText: err.response?.statusText,
        data: err.response?.data,
        headers: err.response?.headers,
      });
    } else if (err instanceof Error) {
      errorMsg = err.message;
    }
    console.error("AI Detection error:", err);
    throw new Error(`AI Detection failed: ${errorMsg}`);
  }
}
