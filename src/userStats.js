// userStats.js（簡潔＆正確版）

const STORAGE_KEY = "triqUserStats";

export function getUserStats() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return getDefaultStats();
  try {
    return JSON.parse(raw);
  } catch (e) {
    console.error("❌ ユーザーステータスの読み込み失敗:", e);
    return getDefaultStats();
  }
}

export function saveUserStats(stats) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(stats));
}

export function resetUserStats() {
  localStorage.removeItem(STORAGE_KEY);
}

export function getDefaultStats() {
  return {
    logic: 0,
    persuasiveness: 0,
    expression: 0,
    diversity: 0,
    depth: 0,
    total: 0,
    history: [],
    unlockedTitles: [],
  };
}

// スコア更新＋タイトル付与
export function updateUserStats(newScores, summary = "") {
  const current = getUserStats();

  const newEntry = {
    timestamp: Date.now(),
    summary,
    total: newScores.total,
  };

  const updated = {
    logic: newScores.logic,
    persuasiveness: newScores.persuasiveness,
    expression: newScores.expression,
    diversity: newScores.diversity,
    depth: newScores.depth,
    total: newScores.total,
    history: [...(current.history || []), newEntry],
  };

  const titleInfo = getTitle(updated);
  updated.unlockedTitles = titleInfo.unlocked;

  saveUserStats(updated);
  return updated;
}

// レベル・経験値情報取得
export function getLevelDetails(stats) {
  const history = stats.history || [];
  const numBattles = history.length;

  const avgScore = numBattles > 0
    ? history.reduce((sum, h) => sum + h.total, 0) / numBattles
    : 0;

  const baseExp = Math.floor((numBattles * avgScore) / 5);
  const rawExp = Math.max(0, baseExp);
  const exp = applyExpPenalty(rawExp, history);

  const getLevelFromExp = (exp) => {
    let level = 0;
    let threshold = 100;
    while (exp >= threshold) {
      level++;
      threshold += Math.floor(100 * Math.pow(1.2, level));
    }
    return level;
  };

  const getNextExp = (level) => {
    let total = 0;
    for (let i = 0; i <= level; i++) {
      total += Math.floor(100 * Math.pow(1.2, i));
    }
    return total;
  };

  const level = getLevelFromExp(exp);
  const nextLevelExp = getNextExp(level);
  const currentLevelExp = level > 0 ? getNextExp(level - 1) : 0;

  const progress = Math.max(0, exp - currentLevelExp);
  const expGap = Math.max(1, nextLevelExp - currentLevelExp);
  const progressRate = Math.min(1, progress / expGap);

  const previousExp = numBattles >= 2
    ? applyExpPenalty(Math.floor(((numBattles - 1) * avgScore) / 5), history.slice(0, -1))
    : 0;
  const previousLevel = getLevelFromExp(previousExp);

  return {
    level,
    previousLevel,
    exp,
    nextLevelExp,
    progress,
    progressRate,
    avgScore: Math.floor(avgScore),
    numBattles,
  };
}

function applyExpPenalty(baseExp, history) {
  const recent = history.slice(-3);
  const recentAvg = recent.reduce((sum, h) => sum + h.total, 0) / (recent.length || 1);
  return recentAvg <= 30 ? Math.floor(baseExp * 0.5) : Math.max(0, baseExp);
}

// 称号処理（TITLE_LIST は別ファイルで定義）
import { TITLE_LIST } from "./titles";

export function getTitle(stats) {
  const details = getLevelDetails(stats);
  const unlocked = new Set(stats.unlockedTitles || []);
  const eligible = TITLE_LIST.filter((t) => t.condition(stats, details));
  for (const t of eligible) unlocked.add(t.key);
  const current = eligible.length > 0 ? eligible[eligible.length - 1] : null;
  return {
    current,
    unlocked: Array.from(unlocked),
  };
}

// スコア差分取得
export function getStatChanges(current = getUserStats()) {
  const history = current.history || [];
  if (history.length < 2) return null;
  const prev = history[history.length - 2];
  const latest = history[history.length - 1];
  return {
    logic: current.logic - prev.logic,
    persuasiveness: current.persuasiveness - prev.persuasiveness,
    expression: current.expression - prev.expression,
    diversity: current.diversity - prev.diversity,
    depth: current.depth - prev.depth,
    total: latest.total - prev.total,
  };
}
