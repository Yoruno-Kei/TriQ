// userStats.js
import { TITLE_LIST } from "./titles";

const STORAGE_KEY = "triqUserStats";

export function getUserStats() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return getDefaultStats();
  }
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

// スコアの更新
export function updateUserStats(newScores, summary = "") {
  const current = getUserStats();

  const safe = (n) => Math.max(0, n);

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

  const titleInfo = getTitle(updated); // 新たな称号情報
  updated.unlockedTitles = titleInfo.unlocked;

  saveUserStats(updated);
  return updated;
}

function weightedAverageTotal(history, decayFactor = 0.8) {
  let weightedSum = 0;
  let weightTotal = 0;
  for (let i = history.length - 1, w = 1; i >= 0; i--, w *= decayFactor) {
    weightedSum += history[i].total * w;
    weightTotal += w;
  }
  return weightTotal > 0 ? weightedSum / weightTotal : 0;
}

function weightedAverageWithTimeDecay(history, decayRatePerDay = 0.02) {
  const now = Date.now();
  let weightedSum = 0;
  let weightTotal = 0;

  for (const entry of history) {
    const elapsedDays = (now - entry.timestamp) / (1000 * 60 * 60 * 24);
    const weight = Math.exp(-decayRatePerDay * elapsedDays);

    weightedSum += entry.total * weight;
    weightTotal += weight;
  }

  return weightTotal > 0 ? weightedSum / weightTotal : 0;
}

/** 総合スコア（5項目の合計）からレベルを計算（0以上） */
export function getLevelDetails(stats) {
  const history = stats.history || [];
  const numBattles = history.length;

  const avgScore = numBattles > 0
    ? history.reduce((sum, h) => sum + h.total, 0) / numBattles
    : 0;

  const weightedAvg = weightedAverageTotal(history);
  const timeDecayAvg = weightedAverageWithTimeDecay(history);

  const combinedAvg = (avgScore * 0.3) + (weightedAvg * 0.4) + (timeDecayAvg * 0.3);
  const baseExp = Math.floor((numBattles * combinedAvg) / 5);
  const rawExp = Math.max(0, baseExp);
  const exp = applyExpPenalty(rawExp, history);

  // 難化するレベル計算（指数関数的）
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
  const nextLevelExp = getNextExp(level + 1);
  const currentLevelExp = level > 0 ? getNextExp(level - 1) : 0;
  const progress = Math.max(0, exp - currentLevelExp);
  const expGap = Math.max(1, nextLevelExp - currentLevelExp);
  const progressRate = Math.min(1, progress / expGap);

  console.log("📊 progressRate:", progressRate);


  const previousExp = numBattles >= 2
    ? applyExpPenalty(Math.floor(((numBattles - 1) * combinedAvg) / 5), history.slice(0, -1))
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
    weightedAvg: Math.floor(weightedAvg),
    timeDecayAvg: Math.floor(timeDecayAvg),
    combinedAvg: Math.floor(combinedAvg),
    numBattles,
  };
}

function applyExpPenalty(baseExp, history) {
  const recent = history.slice(-3);
  const recentAvg = recent.reduce((sum, h) => sum + h.total, 0) / (recent.length || 1);

  let penalizedExp = baseExp;

  // 直近3回の平均スコアが30点以下なら経験値を50%に減らす
  if (recentAvg <= 30) {
    penalizedExp = Math.floor(baseExp * 0.5);
  }

  return Math.max(0, penalizedExp);
}

export function getTitle(stats) {
  const details = getLevelDetails(stats);
  const unlocked = new Set(stats.unlockedTitles || []);

  // 条件を満たす称号を絞り込み
  const eligible = TITLE_LIST.filter((t) => t.condition(stats, details));

  // 新たに解放された称号をセットに追加
  for (const t of eligible) unlocked.add(t.key);

  // 最も上位（最後）の称号を現在の称号とする
  const current = eligible.length > 0 ? eligible[eligible.length - 1] : null;

  return {
    current,
    unlocked: Array.from(unlocked),
  };
}


// 前回との差分を取得
export function getStatChanges(current = getUserStats()) {
  const history = current.history || [];
  if (history.length < 2) return null;

  const prev = history[history.length - 2];
  const latest = history[history.length - 1];

  return {
    logic: (current.logic ?? 0) - (prev.logic ?? 0),
    persuasiveness: (current.persuasiveness ?? 0) - (prev.persuasiveness ?? 0),
    expression: (current.expression ?? 0) - (prev.expression ?? 0),
    diversity: (current.diversity ?? 0) - (prev.diversity ?? 0),
    depth: (current.depth ?? 0) - (prev.depth ?? 0),
    total: (latest.total ?? 0) - (prev.total ?? 0),
  };
}
