// userStats.js

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
    history: [],
  };
}

// スコアの更新
export function updateUserStats(newScores, summary = "") {
  const current = getUserStats();

  const safe = (n) => Math.max(0, n); // 安全関数

  const newEntry = {
    timestamp: Date.now(),
    summary,
    total:
      safe(newScores.logic) +
      safe(newScores.persuasiveness) +
      safe(newScores.expression) +
      safe(newScores.diversity) +
      safe(newScores.depth),
  };

  const updated = {
    logic: newScores.logic,
    persuasiveness: newScores.persuasiveness,
    expression: newScores.expression,
    diversity: newScores.diversity,
    depth: newScores.depth,
    history: [...(current.history || []), newEntry],
  };

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

  // 平均スコア（通常平均）
  const avgScore = numBattles > 0
    ? history.reduce((sum, h) => sum + h.total, 0) / numBattles
    : 0;

  // 重み付き平均（直近重視）
  const weightedAvg = weightedAverageTotal(history);

  // 時間減衰付き重み付き平均（古いバトルは影響減）
  const timeDecayAvg = weightedAverageWithTimeDecay(history);

  // 複合平均スコア（調整可能）
  const combinedAvg = (avgScore * 0.3) + (weightedAvg * 0.4) + (timeDecayAvg * 0.3);

  // 生の経験値（合計スコアに基づく）
  const baseExp = Math.floor((numBattles * combinedAvg) / 5);
  const rawExp = Math.max(0, baseExp);
  const exp = applyExpPenalty(rawExp, history);

  // レベル関連
  const level = Math.floor(exp / 100);
  const nextLevelExp = (level + 1) * 100;
  const currentLevelExp = level * 100;
  const progress = exp - currentLevelExp;
  const progressRate = Math.min(1, Math.max(0, progress / 100));

  // 🔥 前回のレベル（最新バトル前の状態）を履歴から取得
  const previousExp = numBattles >= 2
    ? applyExpPenalty(
        Math.floor(((numBattles - 1) * combinedAvg) / 5),
        history.slice(0, -1) // 最後のバトルを除いた状態
      )
    : 0;
  const previousLevel = Math.floor(previousExp / 100);

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
  const recent = history.slice(-3); // 直近3回
  const recentAvg = recent.reduce((sum, h) => sum + h.total, 0) / (recent.length || 1);

  let penalizedExp = baseExp;

  if (recentAvg < 150) {
    penalizedExp -= 50; // ペナルティ
  }

  return Math.max(0, penalizedExp); // 絶対0未満にしない
}

/** レベルに応じた称号を返す */
export function getTitle(level) {
  const titles = [
    "🍼 ビギナー思考家",
    "🧠 論理の修行者",
    "🎯 詭弁マスター",
    "🔥 思考の錬金術師",
    "👁 真理の探究者",
    "🌪️ 多角的分析官",
    "⚡ 論破の閃光",
    "🦉 知識の賢者",
    "🎭 感情コントローラー",
    "🚀 思考の開拓者",
  ];
  // 配列の範囲内に収める
  const idx = Math.min(titles.length - 1, Math.max(0, level));
  return titles[idx];
}


// 前回との差分を取得
export function getStatChanges(current = getUserStats()) {
  const history = current.history || [];
  if (history.length < 2) return null;

  const prev = history[history.length - 2];
  const latest = history[history.length - 1];

  return {
    logic: current.logic - (prev.logic ?? 0),
    persuasiveness: current.persuasiveness - (prev.persuasiveness ?? 0),
    expression: current.expression - (prev.expression ?? 0),
    diversity: current.diversity - (prev.diversity ?? 0),
    depth: current.depth - (prev.depth ?? 0),
    total: latest.total - prev.total,
  };
}
