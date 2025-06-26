import { AI1_CHARACTERS, AI2_CHARACTERS } from "./aiCharacters";
import { buildPrompt } from "./generatePrompt";
import { generateGeminiResponseWithRetry } from "./geminiWithRetry";
import { handleFinalJudgement } from "./handleFinalJudgement";

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
  userIntro = "",
  userReplies = [],
  userFinal = "",
  onUserTurnChange: setIsUserTurn,
  firstTurnSide = "pro",
}) => {
  if (!topic.trim()) return;

  setIsDebating(true);
  setLog([]);
  logRef.current = [];
  setFinalDecision("");
  setCurrentTopic(topic);

  const ai1Prompts = AI1_CHARACTERS[ai1Persona].prompts;
  const ai2Prompts = AI2_CHARACTERS[ai2Persona].prompts;

  const ai1History = [];
  const ai2History = [];
  const userHistory = [];

  const isUserPro = userSide === "pro";
  const userPrefix = "🧑 あなた：";
  const aiProPrefix = "🧠 AI-1（賛成）：";
  const aiConPrefix = "⚖️ AI-2（反対）：";

  const isProFirst = firstTurnSide === "pro";
  const firstAI = isProFirst ? "AI-1" : "AI-2";
  const secondAI = isProFirst ? "AI-2" : "AI-1";

  const aiRoles = {
    "AI-1": {
      stance: "議題に賛成",
      persona: ai1Prompts.personality,
      prefix: aiProPrefix,
      history: ai1History,
    },
    "AI-2": {
      stance: "議題に反対",
      persona: ai2Prompts.personality,
      prefix: aiConPrefix,
      history: ai2History,
    },
  };

  const addUserLog = (text) => {
    const line = `${userPrefix}${text}`;
    userHistory.push(text);
    logRef.current.push(line);
    setLog([...logRef.current]);
  };

  const addAILog = (text, prefix, history) => {
    const line = `${prefix}${text}`;
    history.push(text);
    logRef.current.push(line);
    setLog([...logRef.current]);
  };

  // --- 冒頭 ---
  if (userDebateMode) {
    const intro = userIntro.trim() || "（ユーザー冒頭意見なし）";
    addUserLog(intro);

    const aiOpponent = isUserPro ? "AI-2" : "AI-1";
    const { stance, persona, prefix, history } = aiRoles[aiOpponent];

    const prompt = buildPrompt({
      role: aiOpponent,
      stance,
      persona,
      type: "rebuttal",
      topic,
      limit: "50",
      opponent: intro,
    });

    const { response } = await generateGeminiResponseWithRetry(prompt);
    const trimmed = response.trim();
    await typeText(trimmed, prefix);
    addAILog(trimmed, prefix, history);
  } else {
    const first = aiRoles[firstAI];
    const second = aiRoles[secondAI];

    const firstPrompt = buildPrompt({
      role: firstAI,
      stance: first.stance,
      persona: first.persona,
      type: "intro",
      topic,
      limit: "50",
    });
    const { response: firstResp } = await generateGeminiResponseWithRetry(firstPrompt);
    await typeText(firstResp.trim(), first.prefix);
    addAILog(firstResp.trim(), first.prefix, first.history);

    const secondPrompt = buildPrompt({
      role: secondAI,
      stance: second.stance,
      persona: second.persona,
      type: "rebuttal",
      topic,
      limit: "50",
      opponent: firstResp.trim(),
    });
    const { response: secondResp } = await generateGeminiResponseWithRetry(secondPrompt);
    await typeText(secondResp.trim(), second.prefix);
    addAILog(secondResp.trim(), second.prefix, second.history);
  }

  // --- 応酬フェーズ ---
  const remainingTurns = turns - 2;
  let userReplyIndex = 0;

  for (let i = 0; i < remainingTurns; i++) {
    const isEven = i % 2 === 0;
    const currentSide = isProFirst ? (isEven ? "pro" : "con") : (isEven ? "con" : "pro");
    const currentAI = currentSide === "pro" ? "AI-1" : "AI-2";
    const opponentAI = currentAI === "AI-1" ? "AI-2" : "AI-1";

    const self = aiRoles[currentAI];
    const opponent = aiRoles[opponentAI];

    if (userDebateMode && currentSide === userSide) {
      setIsUserTurn?.(true);
      const userReply = (userReplies[userReplyIndex] || "").trim() || "（ユーザー発言なし）";
      addUserLog(userReply);
      setIsUserTurn?.(false);
      userReplyIndex++;
    } else {
      const prompt = buildPrompt({
        role: currentAI,
        stance: self.stance,
        persona: self.persona,
        type: "rebuttal",
        topic,
        limit: "50",
        opponent: opponent.history.at(-1) || "",
        summary: self.history.join(" / "),
      });

      const { response } = await generateGeminiResponseWithRetry(prompt);
      await typeText(response.trim(), self.prefix);
      addAILog(response.trim(), self.prefix, self.history);
    }
  }

  // --- 最終意見 ---
  let finalPro = "";
  let finalCon = "";

  if (userDebateMode) {
    finalPro = isUserPro
      ? (userFinal.trim() || "（ユーザー最終意見なし）")
      : (await generateGeminiResponseWithRetry(buildPrompt({
          role: "AI-1",
          stance: "議題に賛成",
          persona: ai1Prompts.personality,
          type: "final",
          topic,
          limit: "100",
          summary: ai1History.join(" / "),
        }))).response.trim();

    finalCon = !isUserPro
      ? (userFinal.trim() || "（ユーザー最終意見なし）")
      : (await generateGeminiResponseWithRetry(buildPrompt({
          role: "AI-2",
          stance: "議題に反対",
          persona: ai2Prompts.personality,
          type: "final",
          topic,
          limit: "100",
          summary: ai2History.join(" / "),
        }))).response.trim();
  } else {
    finalPro = (await generateGeminiResponseWithRetry(buildPrompt({
      role: "AI-1",
      stance: "議題に賛成",
      persona: ai1Prompts.personality,
      type: "final",
      topic,
      limit: "100",
      summary: ai1History.join(" / "),
    }))).response.trim();

    finalCon = (await generateGeminiResponseWithRetry(buildPrompt({
      role: "AI-2",
      stance: "議題に反対",
      persona: ai2Prompts.personality,
      type: "final",
      topic,
      limit: "100",
      summary: ai2History.join(" / "),
    }))).response.trim();
  }

  if (userDebateMode && isUserPro) {
    addUserLog(finalPro);
  } else {
    await typeText(finalPro, aiProPrefix);
    addAILog(finalPro, aiProPrefix, ai1History);
  }

  if (userDebateMode && !isUserPro) {
    addUserLog(finalCon);
  } else {
    await typeText(finalCon, aiConPrefix);
    addAILog(finalCon, aiConPrefix, ai2History);
  }

  // --- 判定 ---
  await handleFinalJudgement({
    topic,
    ai1History,
    ai2History,
    userHistory,
    userDebateMode,
    userSide,
    typeText,
    setFinalDecision,
  });

  // --- ログ保存 ---
  const newLog = {
    id: crypto.randomUUID(),
    topic,
    tags: [],
    log: logRef.current,
    winner: userDebateMode ? "ユーザー対AIの討論" : "AI同士の討論",
    comment: "",
    timestamp: new Date().toISOString(),
    ai1PersonaKey: ai1Persona,
    ai2PersonaKey: ai2Persona,
    ai1PersonaLabel: AI1_CHARACTERS[ai1Persona].label,
    ai2PersonaLabel: AI2_CHARACTERS[ai2Persona].label,
    userDebateMode,
    userSide,
  };

  const logs = JSON.parse(localStorage.getItem("triqLogs") || "[]");
  logs.push(newLog);
  localStorage.setItem("triqLogs", JSON.stringify(logs));
  setSavedLogs(logs);
  setTopic("");
  setIsDebating(false);
};
