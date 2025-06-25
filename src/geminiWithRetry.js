// geminiWithRetry.js

import { generateGeminiResponse25, generateGeminiResponse20 } from "./gemini";

let currentModel = "2.5"; // "2.5" or "2.0"
let lastFallbackTime = null;
const FALLBACK_TIMEOUT = 2 * 60 * 1000; // 2分
const RETRY_LIMIT_25 = 3; // 2.5の試行回数

export function getCurrentGeminiModel() {
  return currentModel;
}

export async function generateGeminiResponseWithRetry(prompt, retryDelayMs = 2000) {
  let lastError = null;

  // --- 試行: Gemini 2.5 を RETRY_LIMIT_25 回まで試す ---
  for (let attempt = 0; attempt < RETRY_LIMIT_25; attempt++) {
    try {
      await randomDelay();
      const response = await generateGeminiResponse25(prompt);
      if (!response || !response.trim()) throw new Error("空レスポンス");
      currentModel = "2.5";
      return response;
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

      if (attempt < RETRY_LIMIT_25 - 1 && isOverloaded) {
        await wait(retryDelayMs);
      }
    }
  }

  // --- フォールバック: Gemini 2.0 ---
  try {
    await randomDelay();
    const response = await generateGeminiResponse20(prompt);
    if (!response || !response.trim()) throw new Error("空レスポンス (2.0)");
    currentModel = "2.0";
    return response;
  } catch (err) {
    console.error("Gemini 2.0も失敗:", err);
    throw lastError || err;
  }
}

// 別の場所で定期的に2.5に戻れるか確認する仕組み（例: useEffectで）
export async function tryRestoreGemini25() {
  if (currentModel === "2.0" && lastFallbackTime && Date.now() - lastFallbackTime > FALLBACK_TIMEOUT) {
    try {
      const result = await generateGeminiResponse25("test");
      if (result && result.trim()) {
        console.log("✅ Gemini 2.5への自動復帰成功");
        currentModel = "2.5";
        lastFallbackTime = null;
      }
    } catch (_) {
      // still failed
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

function randomDelay(min = 1000, max = 2000) {
  const delay = Math.floor(Math.random() * (max - min)) + min;
  return wait(delay);
}
