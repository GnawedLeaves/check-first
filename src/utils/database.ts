import { db } from "../service/firebaseAdmin.js";

export interface ImageCheckResult {
  chatId: number;
  userId: number;
  isAI: boolean; // true if AI score > 0.75
  aiScore: number;
  label: "ai" | "real" | "uncertain";
  hasC2PA: boolean;
  softwareTag: string | null;
  createdAt: Date;
  source: "telegram" | "whatsapp";
}

const COLLECTION_NAME = "checkFirstLahStat";

export async function saveImageResult(result: ImageCheckResult): Promise<void> {
  try {
    await db.collection(COLLECTION_NAME).add({
      ...result,
      createdAt: new Date().toISOString(),
    });
  } catch (err) {
    console.error("Error saving image result:", err);
    throw err;
  }
}

export async function getStatsForChat(chatId: number): Promise<{
  total: number;
  aiGenerated: number;
  real: number;
  uncertain: number;
  aiPercentage: number;
  recentResults: ImageCheckResult[];
}> {
  try {
    const snapshot = await db
      .collection(COLLECTION_NAME)
      .where("chatId", "==", chatId)
      .orderBy("createdAt", "desc")
      .limit(100)
      .get();

    const results = snapshot.docs.map((doc: any) => ({
      ...doc.data(),
      createdAt: new Date(doc.data().createdAt),
    })) as ImageCheckResult[];

    const total = results.length;
    const aiGenerated = results.filter((r) => r.isAI).length;
    const real = results.filter((r) => r.label === "real").length;
    const uncertain = results.filter((r) => r.label === "uncertain").length;
    const aiPercentage =
      total > 0 ? Math.round((aiGenerated / total) * 100) : 0;

    return {
      total,
      aiGenerated,
      real,
      uncertain,
      aiPercentage,
      recentResults: results.slice(0, 5), // Last 5 for reference
    };
  } catch (err) {
    console.error("Error fetching stats:", err);
    throw err;
  }
}

export async function getGlobalStats(): Promise<{
  totalImages: number;
  aiGeneratedCount: number;
  realCount: number;
  uncertainCount: number;
  aiPercentage: number;
  uniqueUsers: number;
}> {
  try {
    const snapshot = await db.collection(COLLECTION_NAME).get();
    const results = snapshot.docs.map((doc: any) =>
      doc.data(),
    ) as ImageCheckResult[];

    const totalImages = results.length;
    const aiGeneratedCount = results.filter((r) => r.isAI).length;
    const realCount = results.filter((r) => r.label === "real").length;
    const uncertainCount = results.filter(
      (r) => r.label === "uncertain",
    ).length;
    const aiPercentage =
      totalImages > 0 ? Math.round((aiGeneratedCount / totalImages) * 100) : 0;

    const uniqueUsers = new Set(results.map((r) => `${r.source}-${r.userId}`))
      .size;

    return {
      totalImages,
      aiGeneratedCount,
      realCount,
      uncertainCount,
      aiPercentage,
      uniqueUsers,
    };
  } catch (err) {
    console.error("Error fetching global stats:", err);
    throw err;
  }
}
