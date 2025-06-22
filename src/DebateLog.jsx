import React from "react";
import { motion } from "framer-motion";

export default function DebateLog({ log, typingLog }) {
  // 応酬フェーズと最終フェーズで分離
  const exchangeLogs = log.filter(
    (entry) =>
      !entry.startsWith("🧠 AI-1（最終意見）：") &&
      !entry.startsWith("⚖️ AI-2（最終意見）：") &&
      !entry.startsWith("🧩")
  );

  const finalLogs = log.filter(
    (entry) =>
      entry.startsWith("🧠 AI-1（最終意見）：") ||
      entry.startsWith("⚖️ AI-2（最終意見）：")
  );

  const judgeLog = log.find((entry) => entry.startsWith("🧩"));

  // ログ描画ユーティリティ
  const renderEntry = (entry, idx) => {
    const isAI1 = entry.startsWith("🧠");
    const isAI2 = entry.startsWith("⚖️");
    const isAI3 = entry.startsWith("🧩");
    const isFinal1 = entry.startsWith("🧠 AI-1（最終意見）：");
    const isFinal2 = entry.startsWith("⚖️ AI-2（最終意見）：");

    const cleanEntry = entry.replace(
    /^🧠 AI-1（最終意見）：|^🧠 AI-1（賛成）：|^🧠 .*?：|^⚖️ AI-2（最終意見）：|^⚖️ AI-2（反対）：|^⚖️ .*?：|^🧩 .*?：/, 
    ""
  );

    const baseClasses =
    "max-w-[90%] p-6 rounded-2xl shadow-xl whitespace-pre-wrap font-sans text-base sm:text-lg leading-relaxed";

  let containerClass = "flex ";
  let bubbleClass = "";
  let label = "";

  if (isAI1) {
    containerClass += "justify-start";
    bubbleClass =
      "bg-gradient-to-br from-blue-200 to-white border-l-4 border-blue-500 text-gray-900 text-left";
    label = isFinal1 ? "🧠 AI-1（最終意見）" : "🧠 AI-1（賛成）";
  } else if (isAI2) {
    containerClass += "justify-end";
    bubbleClass =
      "bg-gradient-to-bl from-red-200 to-white border-r-4 border-red-500 text-gray-900 text-left";
    label = isFinal2 ? "⚖️ AI-2（最終意見）" : "⚖️ AI-2（反対）";
  } else if (isAI3) {
    containerClass += "justify-center";
    bubbleClass =
      "bg-gradient-to-b from-green-100 to-white border-t-4 border-green-500 text-gray-900 text-center";
    label = "🧩 AI-3（判定）";
  } else {
    containerClass += "justify-start";
    bubbleClass = "bg-gray-200 text-gray-900 border border-gray-300";
    label = "AI";
  }

  return (
    <motion.div
      key={idx}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className={`${containerClass} mb-4`}
    >
      <div className={`${bubbleClass} ${baseClasses}`}>
        <div className="text-sm sm:text-base font-semibold opacity-70 mb-1 select-none">
          {label}
        </div>
        <div>{cleanEntry}</div>
      </div>
    </motion.div>
  );
  };

  return (
    <div className="mt-6 space-y-8 max-w-[min(600px,90vw)] mx-auto pb-64">
      {/* タイピング中 */}
      {typingLog && (
        <motion.div
          key="thinking"
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 1, 0.4, 1] }}
          transition={{ repeat: Infinity, duration: 1.2 }}
          className="p-4 rounded bg-black text-white text-lg font-mono shadow-lg"
        >
          {typingLog}
        </motion.div>
      )}

      {/* 応酬フェーズ */}
      {exchangeLogs.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg sm:text-xl font-bold text-indigo-300 border-b border-indigo-500 pb-1">
            🌀 応酬フェーズ
          </h2>
          {exchangeLogs.map(renderEntry)}
        </div>
      )}

      {/* 最終意見フェーズ */}
      {finalLogs.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg sm:text-xl font-bold text-purple-300 border-b border-purple-500 pb-1">
            🧭 最終意見フェーズ
          </h2>
          {finalLogs.map(renderEntry)}
        </div>
      )}

      {/* 判定 */}
      {judgeLog && (
        <div className="space-y-4">
          <h2 className="text-lg sm:text-xl font-bold text-green-500 border-b border-green-600 pb-1">
            🏁 判定フェーズ
          </h2>
          {renderEntry(judgeLog, "judge")}
        </div>
      )}
    </div>
  );
}
