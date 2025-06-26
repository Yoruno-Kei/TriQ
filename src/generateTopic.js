import { generateGeminiResponseWithRetry } from "./geminiWithRetry";

export async function generateDebateTopic(existingTopics = []) {
  // 重複排除しておく
  const uniqueTopics = [...new Set(existingTopics)];

  const prompt = `重複を避け、面白く賛否が分かれる討論テーマを30文字以内でなるべく簡潔に1つ提案してください。提示は議題のみ。
すでに使われたテーマ（最近のもの）: ${uniqueTopics.join(", ")}`;

  const { response } = await generateGeminiResponseWithRetry(prompt);
  const topic = response?.trim() || "AIは人間を超えるか？";
  return topic;
}
