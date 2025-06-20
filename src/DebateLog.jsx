import React from "react";
import { motion } from "framer-motion";

export default function DebateLog({ log, typingLog, finalDecision, topic }) {
  return (
    <div className="mt-6 space-y-4 max-w-[min(600px,90vw)] mx-auto">
      {/* 議題 */}
      {topic && (
        <div className="mb-4 text-white text-center text-lg font-semibold bg-indigo-800 rounded p-3 shadow-md select-text">
          議題: {topic}
        </div>
      )}

      {/* ログ表示 */}
      <div className="flex flex-col gap-3">
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

        {/* 発言ログ */}
        {log.map((entry, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`p-4 rounded text-black text-lg font-mono shadow-lg break-words ${
              entry.startsWith("🧠")
                ? "bg-blue-100"
                : entry.startsWith("⚖️")
                ? "bg-red-100"
                : "bg-green-100"
            }`}
          >
            {entry}
          </motion.div>
        ))}

        {/* 最終結論 */}
        {finalDecision && (
          <div className="p-4 mt-4 bg-yellow-100 text-black text-lg rounded shadow-lg font-semibold select-text">
            {finalDecision}
          </div>
        )}
      </div>
    </div>
  );
}
