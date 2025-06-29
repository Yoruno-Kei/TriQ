export function buildPrompt({
  role,         // "AI-1" or "AI-2"
  stance,       // "賛成" or "反対"
  persona,      // キャラ説明（性格・口調・思考）
  type,         // "intro" | "rebuttal" | "final"
  topic,
  limit,
  opponent,
  summary,
}) {
  let p = `${role}。\n`;
  p +=`あなたの性格・口調・思考：${persona}`;
  p += `制限：${limit}文字以内\n`;
  p += `議題：「${topic}」\n`;

  if (summary) p += `これまでの自分の意見要約：「${summary}」\n`;
  if (opponent) p += `直前の相手意見：「${opponent}」\n`;

  const actions = {
    intro: `${stance}側からの初期意見を述べよ。`,
    rebuttal: `相手の意見を受けて、${stance}側からの意見を述べよ。`,
    final: "総括と補足意見を述べよ。"
  };
  p += actions[type];

  return p;
}
