import React from "react";
import CharacterSlider from "./CharacterSlider";
import StartDebateButton from "./StartDebateButton";
import { AI1_CHARACTERS, AI2_CHARACTERS } from "./aiCharacters";

export default function DebateControls({
  topic,
  setTopic,
  turns,
  setTurns,
  isGeneratingTopic,
  cooldown,
  handleGenerateTopic,
  userDebateMode,
  setUserDebateMode,
  userSide,
  setUserSide,
  ai1Persona,
  setAi1Persona,
  ai2Persona,
  setAi2Persona,
  handleStartDebateWithTurnDecider,
  isDebating,
  ai1ScrollRef,
  ai2ScrollRef,
}) {
  return (
    <div>
      <label className="block text-xl text-indigo-300 mb-2 font-semibold">議題</label>
      <textarea
        className="w-full resize-none p-4 rounded bg-gray-900 text-white text-lg mb-4 placeholder-gray-500 border border-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 leading-relaxed"
        rows={1}
        placeholder="議題を入力..."
        value={topic}
        onChange={(e) => {
          setTopic(e.target.value);
          e.target.style.height = "auto";
          e.target.style.height = `${e.target.scrollHeight}px`;
        }}
        style={{ overflow: "hidden" }}
      />

      <div className="flex items-center gap-3 mb-4">
        <button
          onClick={handleGenerateTopic}
          disabled={isGeneratingTopic || cooldown}
          className={`flex items-center gap-2 px-3 py-2 rounded text-sm font-semibold transition border ${
            isGeneratingTopic || cooldown
              ? "bg-gray-800 border-gray-600 text-gray-400 animate-pulse"
              : "bg-indigo-600 hover:bg-indigo-700 text-white border-indigo-500"
          }`}
          title={cooldown ? `クールダウン中です。5秒お待ちください` : ""}
        >
          {isGeneratingTopic ? (
            <svg
              className="animate-spin h-4 w-4 text-white"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path>
            </svg>
          ) : cooldown ? (
            <span>クールダウン中...</span>
          ) : (
            <span>AIで議題生成</span>
          )}
        </button>

        <button
          onClick={() => {
            setUserDebateMode(!userDebateMode);
            setUserSide(null);
          }}
          className="ml-auto px-3 py-2 rounded bg-purple-600 text-white font-semibold hover:bg-purple-700"
        >
          {userDebateMode ? "AI討論へ戻る" : "VS AIモードに移行"}
        </button>
      </div>

      {userDebateMode && (
        <div className="mb-4">
          <label className="block text-sm text-gray-300 mb-1">あなたが担当する側</label>
          <div className="flex gap-4">
            <button
              className={`px-4 py-2 rounded ${userSide === "pro" ? "bg-indigo-600 text-white" : "bg-gray-800 text-gray-300"}`}
              onClick={() => setUserSide("pro")}
            >
              賛成側（AI-1）
            </button>
            <button
              className={`px-4 py-2 rounded ${userSide === "con" ? "bg-indigo-600 text-white" : "bg-gray-800 text-gray-300"}`}
              onClick={() => setUserSide("con")}
            >
              反対側（AI-2）
            </button>
          </div>
        </div>
      )}

      {/* AI-1 キャラ選択 */}
      {(!userDebateMode || userSide === "con") && (
        <CharacterSlider
          title="AI-1（賛成役）を選ぶ"
          characters={AI1_CHARACTERS}
          selectedKey={ai1Persona}
          setSelectedKey={setAi1Persona}
          scrollRef={ai1ScrollRef}
        />
      )}

      {/* AI-2 キャラ選択 */}
      {(!userDebateMode || userSide === "pro") && (
        <CharacterSlider
          title="AI-2（反対役）を選ぶ"
          characters={AI2_CHARACTERS}
          selectedKey={ai2Persona}
          setSelectedKey={setAi2Persona}
          scrollRef={ai2ScrollRef}
        />
      )}

      <div className="mb-4">
        <label className="block text-sm text-gray-300 mb-1">応酬回数</label>
        <select
          value={turns}
          onChange={(e) => setTurns(Number(e.target.value))}
          className="w-full p-3 rounded bg-gray-900 text-white border border-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          {[4, 6, 8, 10].map((num) => (
            <option key={num} value={num}>
              {num}回（{num / 2}往復）{num === 6 ? "（おすすめ）" : ""}
            </option>
          ))}
        </select>
      </div>

      <StartDebateButton
        disabled={!topic.trim() || isDebating}
        onClick={handleStartDebateWithTurnDecider}
        isDebating={isDebating}
      />
    </div>
  );
}
