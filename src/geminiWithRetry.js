// geminiWithRetry.js
import { generateGeminiResponse } from "./gemini";

/**
 * Gemini API にリクエストを送り、過負荷時は自動でリトライする
 * @param {string} prompt - AIに送るプロンプト
 * @param {number} retries - リトライ回数（初期値：3）
 * @param {number} delayMs - 各リトライ前の遅延ミリ秒（初期値：2000）
 * @returns {Promise<string>}
 */
export async function generateGeminiResponseWithRetry(prompt, retries = 3, delayMs = 2000) {
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      // ランダムな待機時間（少し間を空けて送る）
      await new Promise((res) => setTimeout(res, Math.random() * 1000 + 1000));
      const result = await generateGeminiResponse(prompt);
      return result;
    } catch (err) {
      const isOverloaded = err.message?.toLowerCase().includes("overloaded");

      if (attempt < retries - 1 && isOverloaded) {
        console.warn(`Gemini 過負荷。${delayMs}ms 待機後に再試行 (${attempt + 1}/${retries})`);
        await new Promise((res) => setTimeout(res, delayMs));
      } else {
        console.error("Gemini応答エラー:", err);
        throw err;
      }
    }
  }
}
