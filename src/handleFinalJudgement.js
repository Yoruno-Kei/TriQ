import { generateGeminiResponseWithRetry } from "./geminiWithRetry";

export const handleFinalJudgement = async ({
  topic,
  ai1History,
  ai2History,
  userHistory,
  userDebateMode,
  userSide,
  typeText,
  setFinalDecision,
}) => {
  let prompt = "";
  let winnerMap = {};

  if (userDebateMode) {
    // ユーザーvsAIの判定プロンプト
    const userIsPro = userSide === "pro";
    const aiHistory = userIsPro ? ai2History : ai1History; // 相手AIの履歴

    prompt = `
あなたはAI討論アプリの判定役（AI-3）です。
議題：「${topic}」

ユーザー側の発言履歴：
${userHistory.length > 0 ? userHistory.map((t,i) => `${i+1}. ${t}`).join("\n") : "なし"}

相手AI側の発言履歴：
${aiHistory.length > 0 ? aiHistory.map((t,i) => `${i+1}. ${t}`).join("\n") : "なし"}

以上の議論を踏まえ、どちらの意見がより説得力があるか判定してください。

スコア：1〜4のいずれか（1: ユーザー側に賛成、4: AI側に賛成）
説明：なぜその判断に至ったのかを述べてください(200文字以内)。
`;

    winnerMap = {
      1: "あなたの意見に賛成",
      2: "あなたの意見にやや賛成",
      3: "AIの意見にやや賛成",
      4: "AIの意見に賛成",
    };

  } else {
    // AI同士の判定プロンプト
    prompt = `
あなたはAI討論アプリの判定役（AI-3）です。
議題：「${topic}」

賛成側（AI-1）の発言履歴：
${ai1History.map((t,i) => `${i+1}. ${t}`).join("\n")}

反対側（AI-2）の発言履歴：
${ai2History.map((t,i) => `${i+1}. ${t}`).join("\n")}

以上の議論を踏まえ、どちらの意見がより説得力があるか判定してください。

スコア：1〜4のいずれか（1: AI-1に賛成、4: AI-2に賛成）
説明：なぜその判断に至ったのかを述べてください(200文字以内)。
`;

    winnerMap = {
      1: "AI-1（賛成）の意見に賛成",
      2: "AI-1（賛成）の意見にやや賛成",
      3: "AI-2（反対）の意見にやや賛成",
      4: "AI-2（反対）の意見に賛成",
    };
  }

  const { response } = await generateGeminiResponseWithRetry(prompt);
  const scoreMatch = response.match(/スコア[:：]\s*([1-4])/);
  const explanationMatch = response.match(/説明[:：]\s*([\s\S]+)/);
  const score = scoreMatch ? parseInt(scoreMatch[1]) : 3;
  const explanation = explanationMatch ? explanationMatch[1].trim() : response.trim();

  await typeText(explanation, "🧩 AI-3（判定）：");

  setFinalDecision(`🏁 結論：${winnerMap[score] || "判定不能"}`);
};
