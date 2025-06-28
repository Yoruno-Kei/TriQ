import { generateGeminiResponseWithRetry } from "./geminiWithRetry";
import { generateEvaluationPrompt } from "./getEvaluationPrompt";
import { updateUserStats } from "./userStats";

const parseScore = (text, key) => {
  const match = text.match(new RegExp(`${key}[:：]\\s*(\\d+)`));
  return match ? parseInt(match[1], 10) : 0;
};

const parseSummary = (text) => {
  const match = text.match(/Summary[:：]\s*(.+)/);
  return match ? match[1].trim() : "評価が取得できませんでした。";
};


export async function evaluateAndUpdateUserStats({ topic, debateSummary, explanation }) {
  const prompt = generateEvaluationPrompt({ topic, debateSummary, explanation });
  const { response } = await generateGeminiResponseWithRetry(prompt);

  const newScores = {
    logic: parseScore(response, "Logic"),
    persuasiveness: parseScore(response, "Persuasiveness"),
    expression: parseScore(response, "Expression"),
    diversity: parseScore(response, "Diversity"),
    depth: parseScore(response, "Depth"),
    total: parseScore(response, "Total"),
  };

  const summary = parseSummary(response);

  // ✅ ここで共通の updateUserStats を使用
  const updatedStats = updateUserStats(newScores, summary);
  return updatedStats;
}
