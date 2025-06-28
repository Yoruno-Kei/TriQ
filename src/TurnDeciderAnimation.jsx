import React, { useEffect, useState } from "react";

export default function TurnDeciderRoulette({ onDecide, userDebateMode = false, userSide = "pro" }) {
  const isUserPro = userSide === "pro";
  const aiSideLabel = isUserPro ? "反対（AI）" : "賛成（AI）";
  const userSideLabel = isUserPro ? "賛成（あなた）" : "反対（あなた）";

const choices = userDebateMode
  ? [
      { label: userSide, text: userSideLabel, color: "text-yellow-400" },
      { label: isUserPro ? "con" : "pro", text: aiSideLabel, color: "text-purple-400" },
    ]
  : [
      { label: "pro", text: "賛成（AI-1）", color: "text-blue-400" },
      { label: "con", text: "反対（AI-2）", color: "text-pink-400" },
    ];


  const [result, setResult] = useState(null);
  const [showResult, setShowResult] = useState(false);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      const selected = choices[Math.floor(Math.random() * choices.length)];
      setResult(selected);
      setShowResult(true);

      setTimeout(() => {
        onDecide(selected.label); // "pro" or "con"
        setVisible(false);
      }, 1500);
    }, 3000);

    return () => clearTimeout(timer);
  }, [onDecide]);

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-[9999] bg-black/50 flex items-center justify-center">
      <div className="bg-gradient-to-br from-gray-800 to-gray-900 text-white rounded-2xl shadow-2xl p-8 w-[90%] max-w-sm text-center animate-fade-in">
        {showResult && result ? (
          <>
            <div className="text-lg mb-2 text-gray-300">先攻は…</div>
            <div className={`text-2xl font-bold ${result.color} animate-pop`}>
              {result.text}
            </div>
          </>
        ) : (
          <>
            <div className="text-xl font-semibold text-gray-300 mb-4">先攻を決定中…</div>
            <div className="w-16 h-16 border-[6px] border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto" />
          </>
        )}
      </div>
    </div>
  );
}
