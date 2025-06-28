import { evaluateAndUpdateUserStats } from "./updateUserStats";
import { getLevelDetails, getTitle, getStatChanges } from "./userStats";

export async function evaluateAndShowResult({
  topic,
  debateSummary,
  explanation,
  setIsEvaluating,
  setEvaluationResult,
  setUserEvaluationSummary,
  setShowEvaluationPopup,
}) {
  setIsEvaluating(true);
  const updatedStats = await evaluateAndUpdateUserStats({
    topic,
    debateSummary,
    explanation,
  });

  const levelInfo = getLevelDetails(updatedStats);
  const title = getTitle(levelInfo.level);
  const changes = getStatChanges(updatedStats);

  console.log("🧪 スコア変化（changes）:", changes);

  setEvaluationResult({
    newScores: {
      logic: updatedStats.logic,
      persuasiveness: updatedStats.persuasiveness,
      expression: updatedStats.expression,
      diversity: updatedStats.diversity,
      depth: updatedStats.depth,
      total: updatedStats.total,
    },
    changes,
    levelInfo,
    title,
    summary: updatedStats.history.at(-1)?.summary || "",
  });

  setUserEvaluationSummary(updatedStats.history.at(-1)?.summary || "");
  setIsEvaluating(false);
  setShowEvaluationPopup(true);
}
