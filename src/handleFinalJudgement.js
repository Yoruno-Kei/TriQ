import { generateGeminiResponseWithRetry } from "./geminiWithRetry";;

export const handleFinalJudgement = async ({
  topic,
  userDebateMode,
  debateSummary,
  showAndLogAIResponse,
  setFinalDecision,
}) => {
  const getPrompt = () => {
    const header = `あなたはAI討論アプリ「TriQ」の判定役AI（AI-3）です。
あなたの役割は、以下の2つの最終意見を読み比べ、「どちらの主張がより説得力があるか」を冷静かつ公平に判断することです。

【議題】
「${topic}」

${userDebateMode ? "【ユーザー vs AI】形式の討論です。" : "【AI同士の討論】形式です。"}

ユーザーのことは、”あなた”と呼んでください。
履歴内の”あなた：”はユーザーの発言のターン。`;

const body = `
    \n本討論の全履歴 : ${debateSummary}`


    const footer = `
【あなたのタスク】
内容を比較し、次の形式で明確に判定を出してください。

【出力フォーマット（厳守）】
スコア: <数字（1〜4）>
説明: <なぜそのスコアになったかを簡潔に述べてください（200文字以内）>

※スコアの意味（厳守）：
${
  userDebateMode
    ? "1: ユーザーに明確に賛成 / 2: ユーザーにやや賛成 / 3: AIにやや賛成 / 4: AIに明確に賛成"
    : "1: 賛成側（AI-1）に明確に賛成 / 2: 賛成側にやや賛成 / 3: 反対側（AI-2）にやや賛成 / 4: 反対側に明確に賛成"
}

※フォーマットが崩れると採点処理に失敗するので厳密に守ってください。
`;

    return `${header}\n${body}\n${footer}`;
  };

  const winnerMap = userDebateMode
    ? {
        1: "あなたの意見に賛成",
        2: "あなたの意見にやや賛成",
        3: "AIの意見にやや賛成",
        4: "AIの意見に賛成",
      }
    : {
        1: "AI-1（賛成）の意見に賛成",
        2: "AI-1（賛成）の意見にやや賛成",
        3: "AI-2（反対）の意見にやや賛成",
        4: "AI-2（反対）の意見に賛成",
      };

  const prompt = getPrompt();
  const { response } = await generateGeminiResponseWithRetry(prompt);

  const score = parseInt(response.match(/スコア[:：] *([1-4])/)?.[1] || "3");
  const explanation = response.match(/説明[:：] *([\s\S]+)/)?.[1]?.trim() || response.trim();

  await showAndLogAIResponse(explanation, "🧩 AI-3（判定）：");

  const winner = winnerMap[score] || "判定不能";
  setFinalDecision(`🏁 判決：${winner}`);

  return { winner, explanation };
};
