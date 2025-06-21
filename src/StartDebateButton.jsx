//StartDebateButton.jsx
import React from "react";

export default function StartDebateButton({ disabled, onClick, isDebating }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`w-full p-4 rounded text-white text-xl font-bold transition relative overflow-hidden
        ${
          isDebating
            ? "bg-gray-800 cursor-not-allowed"
            : "bg-gradient-to-r from-indigo-600 to-purple-700 hover:opacity-90"
        }`}
    >
      {isDebating ? (
        <div className="w-full h-5 flex justify-center items-center gap-1 animate-pulse">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className={`h-full w-1 rounded-full bg-indigo-400 animate-wave`}
              style={{ animationDelay: `${i * 0.1}s` }}
            />
          ))}
        </div>
      ) : (
        <span>開始</span>
      )}
    </button>
  );
}
