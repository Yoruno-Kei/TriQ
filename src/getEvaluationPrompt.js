export function generateEvaluationPrompt({ topic, debateSummary, explanation }) {
  return `
あなたは討論評価AIです。以下の討論ログを読み、ユーザーの討論力を5つの観点で100点満点で評価をしてください。
履歴内の”あなた：”がユーザーの発言のターン。

【議題】
${topic}

【討論履歴】
${debateSummary}

【判定AIの本討論の評論】
${explanation}

【評価項目（各0〜100点）】
Logic（論理性）: 内容の筋が通っているか
Persuasiveness（説得力）: 相手を納得させられるか
Expression（表現力）: 言葉遣いや明瞭さ
Diversity（多様性）: 多角的な視点があるか
Depth（深さ）: 表面的でなく、深い洞察があるか

【出力形式（厳守）】
Logic: <0〜100>
Persuasiveness: <0〜100>
Expression: <0〜100>
Diversity: <0〜100>
Depth: <0〜100>
Summary: <簡潔な総評(良かった点/悪かった点)（100文字以内）>
`;
}
