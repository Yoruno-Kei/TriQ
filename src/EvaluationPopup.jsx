import React from "react";
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
} from "recharts";
import { motion, AnimatePresence } from "framer-motion";

export default function EvaluationPopup({ result, onClose }) {
  if (!result) return null;

  const { newScores, changes, levelInfo, title, summary } = result;
  const leveledUp = levelInfo.previousLevel !== undefined && levelInfo.level > levelInfo.previousLevel;

  const data = [
    { subject: "Logic", value: newScores.logic },
    { subject: "Persuasion", value: newScores.persuasiveness },
    { subject: "Expression", value: newScores.expression },
    { subject: "Diversity", value: newScores.diversity },
    { subject: "Depth", value: newScores.depth },
    { subject: "Total", value: newScores.total },
  ];

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
      >
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.8, opacity: 0 }}
          transition={{ type: "spring", duration: 0.5 }}
          className="bg-white rounded-2xl shadow-2xl p-4 sm:p-6 w-full max-w-sm sm:max-w-md md:max-w-lg text-center relative"
        >
          <h2 className="text-2xl font-bold text-gray-800 mb-1">🧠 今回の討論評価</h2>

          {leveledUp && (
            <motion.div
              className="text-pink-600 font-bold text-lg mb-1"
              initial={{ scale: 0, rotate: -10, opacity: 0 }}
              animate={{ scale: 1.2, rotate: 0, opacity: 1 }}
              transition={{ type: "spring", stiffness: 300, damping: 12 }}
            >
              🎉 レベルアップ！
            </motion.div>
          )}

          <motion.p
            className="text-lg font-semibold text-indigo-600 mb-2"
            initial={{ scale: 0 }}
            animate={{ scale: 1.1 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            🌟 {title}（Lv.{levelInfo.level}）
          </motion.p>

          {/* レーダーチャート（レスポンシブ） */}
          <div className="w-full h-[250px] mb-4">
            <ResponsiveContainer>
              <RadarChart cx="50%" cy="50%" outerRadius="80%" data={data}>
                <PolarGrid />
                <PolarAngleAxis dataKey="subject" />
                <PolarRadiusAxis domain={[0, 100]} />
                <Radar
                  name="スコア"
                  dataKey="value"
                  stroke="#4f46e5"
                  fill="#6366f1"
                  fillOpacity={0.5}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>

          {/* 経験値バー */}
          <div className="mb-4">
            <p className="text-sm text-gray-600">
              経験値: {levelInfo.exp} / {levelInfo.nextLevelExp}
            </p>
            <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden mt-1">
              <motion.div
                className="bg-green-500 h-full"
                initial={{ width: 0 }}
                animate={{ width: `${levelInfo.progressRate * 100}%` }}
                transition={{ duration: 1 }}
              />
            </div>
          </div>

          {/* スコア変化 */}
          <div className="text-left text-sm text-gray-700 mb-4">
            <p className="font-semibold mb-1">📈 今回の変化:</p>
            <ul className="list-disc list-inside">
              {Object.entries(changes).map(([key, value]) =>
                key !== "total" ? (
                  <li key={key}>
                    {key[0].toUpperCase() + key.slice(1)}: {value >= 0 ? "+" : ""}
                    {value}
                  </li>
                ) : null
              )}
              <li>総合得点: {changes.total >= 0 ? "+" : ""}{changes.total}</li>
            </ul>
          </div>

          {/* 総評 */}
          <div className="text-sm text-gray-800 text-left whitespace-pre-wrap">
            <p className="font-semibold mb-1">評論AIの総評：</p>
            <p>{summary}</p>
          </div>

          {/* 閉じるボタン */}
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={onClose}
            className="mt-6 w-full bg-indigo-600 text-white py-2 rounded-xl shadow-md hover:bg-indigo-700 transition"
          >
            確認
          </motion.button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
