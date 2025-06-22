import React from "react";
import { highlightTags } from "./highlightTags";

export function getPhase(line) {
  if (
    line.startsWith("🧠 AI-1（最終意見）：") ||
    line.startsWith("⚖️ AI-2（最終意見）：")
  ) return "final";
  if (line.startsWith("🧩")) return "judge";
  return "exchange";
}

export function getSpeaker(line) {
  if (line.startsWith("🧠")) return "ai1";
  if (line.startsWith("⚖️")) return "ai2";
  if (line.startsWith("🧩")) return "judge";
  return "other";
}

export function LogBubble({ line, idx }) {
  const speaker = getSpeaker(line);
  const clean = line.replace(
    /^🧠 AI-1（最終意見）：|^🧠 AI-1（賛成）：|^🧠 .*?：|^⚖️ AI-2（最終意見）：|^⚖️ AI-2（反対）：|^⚖️ .*?：|^🧩 .*?：/,
    ""
  );

  const baseClasses =
    "max-w-[90%] p-6 rounded-2xl shadow-xl whitespace-pre-wrap font-sans text-base sm:text-lg leading-relaxed mb-4";
  let bubbleClass = "";
  let containerClass = "flex ";
  let label = "";

  switch (speaker) {
    case "ai1":
      bubbleClass =
        "bg-gradient-to-br from-blue-200 to-white border-l-4 border-blue-500 text-gray-900 text-left";
      containerClass += " justify-start";
      label = "🧠 AI-1（賛成）";
      break;
    case "ai2":
      bubbleClass =
        "bg-gradient-to-bl from-red-200 to-white border-r-4 border-red-500 text-gray-900 text-left";
      containerClass += " justify-end";
      label = "⚖️ AI-2（反対）";
      break;
    case "judge":
      bubbleClass =
        "bg-gradient-to-b from-green-100 to-white border-t-4 border-green-500 text-gray-900 text-center";
      containerClass += " justify-center";
      label = "🧩 AI-3（判定）";
      break;
    default:
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
