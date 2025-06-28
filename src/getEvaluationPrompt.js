export function generateEvaluationPrompt({ topic, debateSummary, explanation }) {
  return `
あなたは討論評価AIです。以下の討論ログを読み、ユーザーの討論力を5つの観点で100点満点で評価してください。
また、それらを踏まえた「総合評価（Total）」を100点満点で付けてください。
全体の総評は、良かった点と改善点の両方を含め、簡潔に述べてください。
※点数は甘くせず、客観的かつ辛口で評価してください。

ユーザーの発言は「あなた：」という表記で示されています。

---

【議題】
${topic}

【討論履歴】
${debateSummary}

【判定AIの本討論の評論】
${explanation}

---

【評価項目（各0〜100点）】
- Logic（論理性）: 筋の通った論理展開
- Persuasiveness（説得力）: 相手を納得させる力
- Expression（表現力）: 言葉選び、明確さ
- Diversity（多様性）: 多角的な視点や柔軟さ
- Depth（深さ）: 思考の深さ・洞察力

【総合評価】
- Total（総合点）: 全体を通じた総合力

---

【出力フォーマット（必ず以下の形式・順番・英語キーを使って出力してください）】

Logic: <半角数字（例：70）>
Persuasiveness: <半角数字（例：65）>
Expression: <半角数字（例：60）>
Diversity: <半角数字（例：55）>
Depth: <半角数字（例：50）>
Total: <半角数字（例：60）>
Summary: <100文字以内の簡潔な総評>
`;
}
