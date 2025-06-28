import React from "react";
import { highlightTags } from "./highlightTags";

export function getPhase(line) {
  if (
    line.startsWith("🧠 AI-1（最終意見）：") ||
    line.startsWith("⚖️ AI-2（最終意見）：") ||
    line.startsWith("🧑 あなた（最終意見）：")
  )
    return "final";
  if (line.startsWith("🧩")) return "judge";
  return "exchange";
}

export function getSpeaker(line) {
  if (line.startsWith("🧠")) return "ai1";
  if (line.startsWith("⚖️")) return "ai2";
  if (line.startsWith("🧑")) return "user";
  if (line.startsWith("🧩")) return "judge";
  return "other";
}

export function LogBubble({ line, idx, userSide }) {
  const speaker = getSpeaker(line);

  const clean = line.replace(
    /^🧠 AI-1（最終意見）：|^🧠 AI-1（賛成）：|^🧠 .*?：|^⚖️ AI-2（最終意見）：|^⚖️ AI-2（反対）：|^⚖️ .*?：|^🧩 .*?：|^🧑 あなた（最終意見）：|^🧑 あなた：/,
    ""
  );

  const baseClasses =
    "max-w-[90%] p-6 rounded-2xl shadow-xl whitespace-pre-wrap font-sans text-base sm:text-lg leading-relaxed mb-4";

  let containerClass = "flex ";
  let bubbleClass = "";
  let label = "";

  if (speaker === "ai1") {
    bubbleClass =
      "bg-gradient-to-br from-blue-200 to-white border-l-4 border-blue-500 text-gray-900 text-left";
    containerClass += " justify-start";

    // VSモード時はAI-1＝賛成側になる
    label = userSide ? "AI（賛成）" : "🧠 AI-1（賛成）";
  } else if (speaker === "ai2") {
    bubbleClass =
      "bg-gradient-to-bl from-red-200 to-white border-r-4 border-red-500 text-gray-900 text-left";
    containerClass += " justify-end";

    // VSモード時はAI-2＝反対側になる
    label = userSide ? "AI（反対）" : "⚖️ AI-2（反対）";
  } else if (speaker === "user") {
    if (userSide === "pro") {
      // ユーザー賛成（左）
      bubbleClass =
        "bg-gradient-to-br from-yellow-200 to-white border-l-4 border-yellow-500 text-gray-900 text-left";
      containerClass += " justify-start";
      label = "🧑 あなた（賛成）";
    } else if (userSide === "con") {
      // ユーザー反対（右）
      bubbleClass =
        "bg-gradient-to-bl from-yellow-200 to-white border-r-4 border-yellow-500 text-gray-900 text-left";
      containerClass += " justify-end";
      label = "🧑 あなた（反対）";
    } else {
      bubbleClass =
        "bg-gradient-to-br from-yellow-200 to-white border-l-4 border-yellow-500 text-gray-900 text-left";
      containerClass += " justify-start";
      label = "🧑 あなた";
    }
  } else if (speaker === "judge") {
    bubbleClass =
      "bg-gradient-to-b from-green-100 to-white border-t-4 border-green-500 text-gray-900 text-center";
    containerClass += " justify-center";
    label = "🧩 AI-3（判定）";
  } else {
    bubbleClass = "bg-gray-200 text-gray-900 border border-gray-300";
    containerClass += " justify-start";
    label = "AI";
  }

  return (
    <div className={containerClass}>
      <div className={`${baseClasses} ${bubbleClass}`}>
        <div className="font-semibold opacity-80 mb-1 select-none">{label}</div>
        <div>{highlightTags(clean)}</div>
      </div>
    </div>
  );
}
