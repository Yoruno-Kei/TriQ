// geminiWithRetry.js

import { generateGeminiResponse25, generateGeminiResponse20 } from "./gemini";

let currentModel = "2.5"; // "2.5" or "2.0"
let lastFallbackTime = null;
const RETRY_LIMIT_25 = 3; // 2.5の試行回数
const baseRetryDelayMs = 2000; // 2秒を基準に指数バックオフ


export function getCurrentGeminiModel() {
  return currentModel;
}

export async function generateGeminiResponseWithRetry(prompt, retryDelayMs = 2000) {
  let lastError = null;

  for (let attempt = 0; attempt < RETRY_LIMIT_25; attempt++) {
    try {
      await randomDelay();
      const response = await generateGeminiResponse25(prompt);
      if (!response || !response.trim()) throw new Error("空レスポンス");
      currentModel = "2.5";
      return { response, model: "2.5" };
    } catch (err) {
      lastError = err;
      const isOverloaded = isOverloadError(err);
      const isQuotaExceeded = isQuotaError(err);

      console.warn(`Gemini 2.5失敗 (${attempt + 1}/${RETRY_LIMIT_25})`, err.message);

      if (isQuotaExceeded) {
        console.warn("✅ Gemini 2.5の無料上限に達しました。2.0へ切替。");
        currentModel = "2.0";
        lastFallbackTime = Date.now();
        break;
      }

      if (isOverloaded) {
        console.warn("⚠️ Gemini 2.5過負荷エラー発生。2.0に切替試行");
        currentModel = "2.0";
        lastFallbackTime = Date.now();
        break;
      }

      if (attempt < RETRY_LIMIT_25 - 1) {
        const delay = baseRetryDelayMs * Math.pow(2, attempt);
        console.log(`Overload retry: wait ${delay}ms before next attempt`);
        await wait(delay);
      } else {
        break;
      }
    }
  }

  // フォールバック: Gemini 2.0
  try {
    await randomDelay();
    const response = await generateGeminiResponse20(prompt);
    if (!response || !response.trim()) throw new Error("空レスポンス (2.0)");
    currentModel = "2.0";
    return { response, model: "2.0" };
  } catch (err) {
    console.error("Gemini 2.0も失敗:", err);
    throw lastError || err;
  }
}

export async function tryRestoreGemini25() {
  if (currentModel === "2.0" && lastFallbackTime && Date.now() - lastFallbackTime > 2 * 60 * 1000) {
    try {
      const result = await generateGeminiResponse25("test");
      if (result && result.trim()) {
        console.log("✅ Gemini 2.5への自動復帰成功");
        currentModel = "2.5";
        lastFallbackTime = null;
      }
    } catch (_) {
      // 復帰失敗は無視
    }
  }
}


function isOverloadError(err) {
  const msg = err.message?.toLowerCase() || "";
  return msg.includes("overloaded") || msg.includes("429") || msg.includes("503") || msg.includes("unavailable");
}

function isQuotaError(err) {
  const msg = err.message?.toLowerCase() || "";
  return msg.includes("quota") || msg.includes("exceeded") || msg.includes("daily");
}

function wait(ms) {
  return new Promise((res) => setTimeout(res, ms));
}

function randomDelay(min = 1000, max = 3500) {
  const delay = Math.floor(Math.random() * (max - min)) + min;
  return wait(delay);
}
