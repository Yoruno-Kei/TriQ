import React, { useEffect, useState } from "react";

const choices = [
  { label: "賛成（AI-1）", color: "#4F46E5" }, // Indigo
  { label: "反対（AI-2）", color: "#EC4899" }, // Pink
];

export default function TurnDeciderSimple({ onDecide }) {
  const [isDeciding, setIsDeciding] = useState(true);
  const [result, setResult] = useState(null);

  useEffect(() => {
    if (!isDeciding) return;

    const timeout = setTimeout(() => {
      const randomChoice = choices[Math.floor(Math.random() * choices.length)];
      setResult(randomChoice);
      setIsDeciding(false);
      onDecide(randomChoice);
    }, 3000); // 3秒後に決定

    return () => clearTimeout(timeout);
  }, [isDeciding, onDecide]);

  return (
    <div className="flex flex-col items-center justify-center p-6 bg-gray-900 rounded-lg shadow-lg w-64 mx-auto select-none">
        {isDeciding ? (
        <>
            <div className="text-xl font-semibold text-gray-300 mb-4">
            先行を決めています…
            </div>
            <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
        </>
        ) : result ? (
        <div
            className="text-2xl font-bold"
            style={{
            color: result.color,
            textShadow: `0 0 10px ${result.color}`,
            }}
        >
            先行：{result.label}
        </div>
        ) : null}
    </div>
  );
}
