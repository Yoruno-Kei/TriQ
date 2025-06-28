import { AI1_CHARACTERS, AI2_CHARACTERS } from "./aiCharacters";
import { buildPrompt } from "./generatePrompt";
import { generateGeminiResponseWithRetry } from "./geminiWithRetry";
import { handleFinalJudgement } from "./handleFinalJudgement";
import { evaluateAndShowResult } from "./evaluateAndShowResult";

export const handleStartDebate = async ({
  topic,
  turns,
  ai1Persona,
  ai2Persona,
  typeText,
  setFinalDecision,
  setLog,
  logRef,
  setIsDebating,
  setSavedLogs,
  setTopic,
  setCurrentTopic,
  userDebateMode = false,
  userSide = "pro",
  firstTurnSide = "pro",
  setIsFinalPhase,
  waitForUserReply,
  setUserEvaluationSummary,
  setEvaluationResult,
  setShowEvaluationPopup,
  setIsEvaluating,
}) => {
    console.log("handleStartDebate called. firstTurnSide:", firstTurnSide);
  if (!topic.trim()) return;
  console.log("userDebateMode:", userDebateMode, "userSide:", userSide, "firstTurnSide:", firstTurnSide);


  setIsDebating(true);
  setLog([]);
  logRef.current = [];
  setFinalDecision("");
  setCurrentTopic(topic);

  const isProFirst = firstTurnSide === "pro";
  const isUserPro = userSide === "pro";

  const aiRoles = {
    "AI-1": {
      stance: "議題に賛成",
      prompts: AI1_CHARACTERS[ai1Persona].prompts,
      prefix: "🧠 AI-1（賛成）：",
      finalPrefix: "🧠 AI-1（最終意見）：",
      history: [],
    },
    "AI-2": {
      stance: "議題に反対",
      prompts: AI2_CHARACTERS[ai2Persona].prompts,
      prefix: "⚖️ AI-2（反対）：",
      finalPrefix: "⚖️ AI-2（最終意見）：",
      history: [],
    },
  };

const addUserLog = (text, isFinal = false) => {
  const prefix = isFinal ? "🧑 あなた（最終意見）：" : "🧑 あなた：";
  const line = prefix + text;
  logRef.current.push(line);
  setLog([...logRef.current]);
};


const showAndLogAIResponse = async (text, role, isFinal = false) => {
  let prefix = "";
  if (role === "AI-1" || role === "AI-2") {
    prefix = isFinal ? aiRoles[role].finalPrefix : aiRoles[role].prefix;
    aiRoles[role].history.push(text);
  } else if (role === "AI-3") {
    prefix = "🧩 AI-3（判定）：";
  } else {
    // 予備対応としてroleをそのままprefixにする場合
    prefix = role;
  }
  await typeText(text, prefix);
  logRef.current.push(`${prefix}${text}`);
  setLog([...logRef.current]);
};


console.log("isProFirst:", firstTurnSide === "pro");
console.log("userGoesFirst:", userDebateMode ? (firstTurnSide === userSide) : null);



  // 冒頭発言
  if (userDebateMode) {
    const aiSide = isUserPro ? "AI-2" : "AI-1";
    const userGoesFirst = firstTurnSide === userSide;

    if (userGoesFirst) {
      const userIntroText = (await waitForUserReply?.())?.trim() || "（ユーザー冒頭意見なし）";
      addUserLog(userIntroText);

      const prompt = buildPrompt({
        role: aiSide,
        stance: aiRoles[aiSide].stance,
        persona: aiRoles[aiSide].prompts.personality,
        type: "rebuttal",
        topic,
        limit: "75",
        opponent: userIntroText,
      });
      const { response } = await generateGeminiResponseWithRetry(prompt);
      await showAndLogAIResponse(response.trim(), aiSide);
    } else {
      const prompt = buildPrompt({
        role: aiSide,
        stance: aiRoles[aiSide].stance,
        persona: aiRoles[aiSide].prompts.personality,
        type: "intro",
        topic,
        limit: "75",
      });
      const { response } = await generateGeminiResponseWithRetry(prompt);
      await showAndLogAIResponse(response.trim(), aiSide);

      const userIntroText = (await waitForUserReply?.())?.trim() || "（ユーザー冒頭意見なし）";
      addUserLog(userIntroText);
    }
  } else {
    // AI同士
    const firstAI = isProFirst ? "AI-1" : "AI-2";
    const secondAI = firstAI === "AI-1" ? "AI-2" : "AI-1";

    const firstPrompt = buildPrompt({
      role: firstAI,
      stance: aiRoles[firstAI].stance,
      persona: aiRoles[firstAI].prompts.personality,
      type: "intro",
      topic,
      limit: "75",
    });
    const { response: firstResp } = await generateGeminiResponseWithRetry(firstPrompt);
    await showAndLogAIResponse(firstResp.trim(), firstAI);

    const secondPrompt = buildPrompt({
      role: secondAI,
      stance: aiRoles[secondAI].stance,
      persona: aiRoles[secondAI].prompts.personality,
      type: "rebuttal",
      topic,
      limit: "75",
      opponent: firstResp.trim(),
    });
    const { response: secondResp } = await generateGeminiResponseWithRetry(secondPrompt);
    await showAndLogAIResponse(secondResp.trim(), secondAI);
  }

const getUserHistoryFromLog = (log) => {
  return log
    .filter((line) => line.startsWith("🧑 あなた："))
    .map((line) => line.replace("🧑 あなた：", "").trim());
};

function getFullHistory(log) {
  const emojiRegex = /^[🧠⚖️🧑🧩]\s?/; // 文頭の絵文字 + 半角スペース（あれば）にマッチ
  return log.map((line) => line.replace(emojiRegex, "").trim());
};


  // 応酬フェーズ
  const remainingTurns = turns - 2;
  let userReplyIndex = 0;

  for (let i = 0; i < remainingTurns; i++) {
    const currentSide = isProFirst
      ? i % 2 === 0 ? "pro" : "con"
      : i % 2 === 0 ? "con" : "pro";
    const currentAI = currentSide === "pro" ? "AI-1" : "AI-2";
    const opponentAI = currentAI === "AI-1" ? "AI-2" : "AI-1";

    if (userDebateMode && currentSide === userSide) {
      const userReply = (await waitForUserReply?.())?.trim() || "（ユーザー発言なし）";
      addUserLog(userReply);

      userReplyIndex++;
    } else {
    const opponentText = userDebateMode && currentSide !== userSide
      ? getUserHistoryFromLog(logRef.current).at(-1) || ""
      : aiRoles[opponentAI].history.at(-1) || "";

      const prompt = buildPrompt({
        role: currentAI,
        stance: aiRoles[currentAI].stance,
        persona: aiRoles[currentAI].prompts.personality,
        type: "rebuttal",
        topic,
        limit: "75",
        opponent: opponentText,
        summary: aiRoles[currentAI].history.join(" / "),
      });
      const { response } = await generateGeminiResponseWithRetry(prompt);
      await showAndLogAIResponse(response.trim(), currentAI);
    }
  }

  setIsFinalPhase(true);

  // 最終意見フェーズ
  const speakFinalOpinion = async (side, isUser, ) => {
    if (isUser) {
      const userFinalText = (await waitForUserReply?.())?.trim() || "（ユーザー最終意見なし）";
      addUserLog(userFinalText, true);
      return userFinalText;
    } else {
      const prompt = buildPrompt({
        role: side,
        stance: aiRoles[side].stance,
        persona: aiRoles[side].prompts.personality,
        type: "final",
        topic,
        limit: "150",
        summary: aiRoles[side].history.join(" / "),
      });
      const { response } = await generateGeminiResponseWithRetry(prompt);
      const trimmed = response.trim();
      await showAndLogAIResponse(trimmed, side, true);
      return trimmed;
    }
  };

const finalResults = {};
const finalOrder = isProFirst ? ["pro", "con"] : ["con", "pro"];

for (const side of finalOrder) {
  const isAI1 = side === "pro";
  const aiKey = isAI1 ? "AI-1" : "AI-2";
  const isUser = userDebateMode && ((side === "pro" && isUserPro) || (side === "con" && !isUserPro));
  const result = await speakFinalOpinion(aiKey, isUser);
  finalResults[aiKey] = result;
}

setIsFinalPhase(false);

const debateSummary = getFullHistory(logRef.current).join(" / ");
  // 判定
  const { winner, explanation } = await handleFinalJudgement({
  topic,
  userDebateMode,
  userSide,
  debateSummary,
  showAndLogAIResponse,
  setFinalDecision,
  setUserEvaluationSummary,
  setEvaluationResult,
  setShowEvaluationPopup,
  getUserHistoryFromLog,
  });

  // 保存
  const newLog = {
    id: crypto.randomUUID(),
    topic,
    tags: [],
    log: logRef.current,
    winner,
    comment: "",
    timestamp: new Date().toISOString(),
    ai1PersonaKey: ai1Persona,
    ai2PersonaKey: ai2Persona,
    ai1PersonaLabel: AI1_CHARACTERS[ai1Persona].label,
    ai2PersonaLabel: AI2_CHARACTERS[ai2Persona].label,
    userDebateMode,
    userSide,
    decidedFirstTurn: firstTurnSide,
  };

    if (userDebateMode) {
    await evaluateAndShowResult({
      topic,
      debateSummary,
      explanation,
      setIsEvaluating,
      setEvaluationResult,
      setUserEvaluationSummary,
      setShowEvaluationPopup,
});

  }

  const logs = JSON.parse(localStorage.getItem("triqLogs") || "[]");
  logs.push(newLog);
  localStorage.setItem("triqLogs", JSON.stringify(logs));
  setSavedLogs(logs);
  setTopic("");
  setIsDebating(false);
  
};
