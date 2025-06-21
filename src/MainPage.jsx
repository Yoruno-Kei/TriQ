import React, { useState, useEffect, useRef} from "react";
import { useNavigate } from "react-router-dom";
import { generateGeminiResponse } from "./gemini";
import Sidebar from "./Sidebar";
import DebateLog from "./DebateLog";
import { BookOpen, X } from "lucide-react";
import { AI1_CHARACTERS, AI2_CHARACTERS } from "./aiCharacters";

export default function MainPage() {
  const [topic, setTopic] = useState("");
  const [turns, setTurns] = useState(4);
  const [log, setLog] = useState([]);
  const [finalDecision, setFinalDecision] = useState("");
  const [savedLogs, setSavedLogs] = useState([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchKeyword, setSearchKeyword] = useState("");
  const [filter, setFilter] = useState("all");
  const [typingLog, setTypingLog] = useState(null);
  const [currentTopic, setCurrentTopic] = useState("");
  const [isDebating, setIsDebating] = useState(false);
  const [selectedTag, setSelectedTag] = useState("");
  const [showMoreTurns, setShowMoreTurns] = useState(false);
  const [ai1Persona, setAi1Persona] = useState("scientist");
  const [ai2Persona, setAi2Persona] = useState("philosopher");

  const logRef = useRef([]);

  const navigate = useNavigate();

  useEffect(() => {
    const logs = JSON.parse(localStorage.getItem("triqLogs") || "[]");
    setSavedLogs(logs);
  }, []);

  const handleMainClick = () => {
    if (sidebarOpen) setSidebarOpen(false);
  };

  const deleteLog = (id) => {
    if (!window.confirm("このログを削除しますか？")) return;
    const updatedLogs = savedLogs.filter((log) => log.id !== id);
    localStorage.setItem("triqLogs", JSON.stringify(updatedLogs));
    setSavedLogs(updatedLogs);
  };

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);
  const closeSidebar = () => setSidebarOpen(false);

  const typeText = (text, prefix = "", delay = 20) => {
    return new Promise((resolve) => {
      let output = "";
      let i = 0;
      const interval = setInterval(() => {
        output += text[i];
        setTypingLog(prefix + output);
        i++;
        if (i >= text.length) {
          clearInterval(interval);
          const finalLine = prefix + text;
          setLog((prev) => [...prev, finalLine]);
          logRef.current.push(finalLine);
          setTypingLog(null);
          resolve();
        }
      }, delay);
    });
  };

  const handleStartDebate = async () => {
    if (!topic.trim()) return;

    setIsDebating(true);
    setLog([]);
    logRef.current = [];
    setFinalDecision("");
    setCurrentTopic(topic);

    const ai1Prompts = AI1_CHARACTERS[ai1Persona].prompts;
    const ai2Prompts = AI2_CHARACTERS[ai2Persona].prompts;

    const ai1History = [];
    const ai2History = [];

    const ai1Intro = await generateGeminiResponse(
      `あなたはAI討論アプリの肯定役（AI-1）です。\n${ai1Prompts.intro}\n議題：「${topic}」`
    );
    ai1History.push(ai1Intro.trim());
    await typeText(ai1Intro.trim(), "🧠 AI-1（賛成）：");

    const ai2Intro = await generateGeminiResponse(
      `あなたはAI討論アプリの反対役（AI-2）です。\n${ai2Prompts.intro}\n議題：「${topic}」\nAI-1の意見：「${ai1Intro.trim()}」`
    );
    ai2History.push(ai2Intro.trim());
    await typeText(ai2Intro.trim(), "⚖️ AI-2（反対）：");

    for (let i = 0; i < turns - 2; i++) {
      if (i % 2 === 0) {
        const prompt = `あなたはAI討論アプリの肯定役（AI-1）です。\n${ai1Prompts.rebuttal}\n議題：「${topic}」\nAI-2の意見：「${ai2History[ai2History.length - 1]}」`;
        const response = await generateGeminiResponse(prompt);
        ai1History.push(response.trim());
        await typeText(response.trim(), "🧠 AI-1（再反論）：");
      } else {
        const prompt = `あなたはAI討論アプリの反対役（AI-2）です。\n${ai2Prompts.rebuttal}\n議題：「${topic}」\nAI-1の意見：「${ai1History[ai1History.length - 1]}」`;
        const response = await generateGeminiResponse(prompt);
        ai2History.push(response.trim());
        await typeText(response.trim(), "⚖️ AI-2（再反論）：");
      }
    }

    const summary1 = ai1History.join(" / ");
    let finalAI1 = (
      await generateGeminiResponse(
        `あなたはAI討論アプリの肯定役（AI-1）です。以下はこれまでの自分の意見の流れです：「${summary1}」\nこれらを要約し、最後に追加したい意見を含めて200文字以内で最終的な見解を述べてください。\n議題：「${topic}」`
      )
    ).trim();
    await typeText(finalAI1, "🧠 AI-1（最終意見）：");

    const summary2 = ai2History.join(" / ");
    let finalAI2 = (
      await generateGeminiResponse(
        `あなたはAI討論アプリの反対役（AI-2）です。以下はこれまでの自分の意見の流れです：「${summary2}」\nこれらを要約し、最後に追加したい意見を含めて200文字以内で最終的な見解を述べてください。\n議題：「${topic}」`
      )
    ).trim();
    await typeText(finalAI2, "⚖️ AI-2（最終意見）：");

    const promptJudge = `あなたはAI討論アプリの判定役（AI-3）です。
あなたは中立で公正な審査官として、議論全体を俯瞰し、どちらの主張がより説得力があったかを評価します。

まず、1〜5の数字だけを出力してください：
1 = AI-1（賛成）の意見に完全に賛成
2 = AI-1にやや賛成
3 = 両者同等、判定不能
4 = AI-2にやや賛成
5 = AI-2（反対）の意見に完全に賛成

続いて、200文字以内で理由を述べてください。

フォーマット：
スコア: [1-5]
説明: [理由]

議題：「${topic}」
AI-1の意見：「${ai1History[ai1History.length - 1]}」
AI-2の意見：「${ai2History[ai2History.length - 1]}」`;

    const aiJudge = await generateGeminiResponse(promptJudge);
    const scoreMatch = aiJudge.match(/スコア[:：]\s*([1-5])/);
    const score = scoreMatch ? parseInt(scoreMatch[1]) : 3;
    const explanationMatch = aiJudge.match(/説明[:：]\s*([\s\S]+)/);
    const aiJudgeText = explanationMatch ? explanationMatch[1].trim() : "";
    await typeText(aiJudgeText, "🧩 AI-3（判定）：");

    const winnerMap = {
      1: "AI-1（賛成）の意見に賛成",
      2: "AI-1（賛成）の意見にやや賛成",
      3: "判定不能（引き分け）",
      4: "AI-2（反対）の意見にやや賛成",
      5: "AI-2（反対）の意見に賛成"
    };
    setFinalDecision(`🏁 結論：${winnerMap[score] || "判定不能"}`);

    const newLog = {
      id: crypto.randomUUID(),
      topic,
      tags: [],
      log: logRef.current,
      winner,
      comment: "",
      timestamp: new Date().toISOString(),
      ai1PersonaKey: ai1Persona,
      ai2PersonaKey: ai2Persona,
      ai1PersonaLabel: AI1_CHARACTERS[ai1Persona].label,
      ai2PersonaLabel: AI2_CHARACTERS[ai2Persona].label,
    };

    const logs = JSON.parse(localStorage.getItem("triqLogs") || "[]");
    logs.push(newLog);
    localStorage.setItem("triqLogs", JSON.stringify(logs));
    setSavedLogs(logs);
    setTopic("");
    setIsDebating(false);
  };


  return (
    <main
      className="min-h-screen bg-gradient-to-br from-gray-950 via-slate-900 to-gray-800 text-white p-6 font-sans relative"
      onClick={handleMainClick}
    >
      <Sidebar
        sidebarOpen={sidebarOpen}
        closeSidebar={closeSidebar}
        savedLogs={savedLogs}
        filteredLogs={savedLogs.filter((log) => {
  const keywordMatch = log.topic.includes(searchKeyword);

  const filterMatch =
    filter === "all"
      ? true
      : filter === "pro"
      ? log.winner.startsWith("AI-1")
      : filter === "con"
      ? log.winner.startsWith("AI-2")
      : log.winner.startsWith("判定不能");

  const tagMatch = selectedTag === "" || (log.tags || []).includes(selectedTag);

  return keywordMatch && filterMatch && tagMatch;
})}

        searchKeyword={searchKeyword}
        setSearchKeyword={setSearchKeyword}
        filter={filter}
        setFilter={setFilter}
        deleteLog={deleteLog}
        navigate={navigate}
        selectedTag={selectedTag}
        setSelectedTag={setSelectedTag}
      />

      <div
        className="max-w-[min(600px,90vw)] mx-auto pt-6 relative z-10"
        onClick={(e) => e.stopPropagation()}
      ></div>

      <div className="max-w-[min(600px,90vw)] mx-auto pt-6">
        <input
          className="w-full p-4 rounded bg-gray-900 text-white text-lg mb-4 placeholder-gray-500 border border-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          type="text"
          placeholder="議題を入力..."
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
        />

      {/* AI キャラ選択 UI（スライダー形式） */}
<div className="mb-8">
  <div className="text-white font-semibold mb-2">AI-1（賛成役）を選ぶ</div>
  <div
    className="overflow-x-auto flex gap-4 py-2 scrollbar-hide"
    style={{ scrollSnapType: "x mandatory" }}
  >
    {Object.entries(AI1_CHARACTERS).map(([key, char]) => {
      const selected = ai1Persona === key;
      return (
        <div
          key={key}
          onClick={() => setAi1Persona(key)}
          className={`min-w-[140px] flex-shrink-0 rounded-xl border transition cursor-pointer relative
            ${
              selected
                ? "border-indigo-500 scale-105 shadow-xl bg-gradient-to-b from-indigo-900 to-gray-800"
                : "border-gray-700 bg-gray-800"
            }
            hover:shadow-lg hover:scale-105 duration-200`}
          style={{ scrollSnapAlign: "start" }}
          tabIndex={0} // キーボード操作対応（必要なら）
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") setAi1Persona(key);
          }}
        >
          <img
            src={char.image}
            alt={char.label}
            className="w-full h-28 object-cover rounded-t-xl"
          />
          <div className="p-2 text-center text-sm font-semibold text-white">
            {char.label}
          </div>
        </div>
      );
    })}
  </div>

  {ai1Persona && (
    <div className="mt-4 p-4 rounded-xl bg-gray-800 border border-indigo-700 shadow-inner">
      <h3 className="text-lg font-bold text-indigo-300">
        {AI1_CHARACTERS[ai1Persona].label}
      </h3>
      <p className="text-sm text-gray-300 mt-1">
        {AI1_CHARACTERS[ai1Persona].description}
      </p>
      <p className="text-xs italic text-gray-400 mt-2">
        例：{AI1_CHARACTERS[ai1Persona].preview}
      </p>
    </div>
  )}
</div>

{/* AI-2 キャラ選択 UI */}
<div className="mb-8">
  <div className="text-white font-semibold mb-2">AI-2（反対役）を選ぶ</div>
  <div
    className="overflow-x-auto flex gap-4 py-2 scrollbar-hide"
    style={{ scrollSnapType: "x mandatory" }}
  >
    {Object.entries(AI2_CHARACTERS).map(([key, char]) => {
      const selected = ai2Persona === key;
      return (
        <div
          key={key}
          onClick={() => setAi2Persona(key)}
          className={`min-w-[140px] flex-shrink-0 rounded-xl border transition cursor-pointer relative
            ${
              selected
                ? "border-indigo-500 scale-105 shadow-xl bg-gradient-to-b from-indigo-900 to-gray-800"
                : "border-gray-700 bg-gray-800"
            }
            hover:shadow-lg hover:scale-105 duration-200`}
          style={{ scrollSnapAlign: "start" }}
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") setAi2Persona(key);
          }}
        >
          <img
            src={char.image}
            alt={char.label}
            className="w-full h-28 object-cover rounded-t-xl"
          />
          <div className="p-2 text-center text-sm font-semibold text-white">
            {char.label}
          </div>
        </div>
      );
    })}
  </div>

  {ai2Persona && (
    <div className="mt-4 p-4 rounded-xl bg-gray-800 border border-indigo-700 shadow-inner">
      <h3 className="text-lg font-bold text-indigo-300">
        {AI2_CHARACTERS[ai2Persona].label}
      </h3>
      <p className="text-sm text-gray-300 mt-1">
        {AI2_CHARACTERS[ai2Persona].description}
      </p>
      <p className="text-xs italic text-gray-400 mt-2">
        例：{AI2_CHARACTERS[ai2Persona].preview}
      </p>
    </div>
  )}
</div>

        {/* 応酬回数セレクト UI */}
  <div className="mb-4">
    <label className="block text-sm text-gray-300 mb-1">応酬回数</label>
    <select
      value={turns}
      onChange={(e) => setTurns(Number(e.target.value))}
      className="w-full p-3 rounded bg-gray-900 text-white border border-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-500"
    >
      {[4, 6, 8, 10, ...(showMoreTurns ? [12, 14, 16] : [])].map((num) => (
        <option key={num} value={num}>
          {num}回（{num / 2}往復）{num === 8 ? "（おすすめ）" : ""}
        </option>
      ))}
    </select>
    {!showMoreTurns && (
      <button
        onClick={() => setShowMoreTurns(true)}
        className="mt-2 text-sm text-indigo-400 hover:underline"
      >
        もっと見る
      </button>
    )}
  </div>

        <button
          onClick={handleStartDebate}
          disabled={!topic.trim() || isDebating}
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

        {currentTopic && (
          <div className="text-center text-indigo-300 mt-4 select-text text-lg sm:text-xl font-semibold">
            現在の議題：{"「" + currentTopic + "」"}
          </div>
        )}

        {finalDecision && (
          <div className="mt-3 max-w-md mx-auto rounded-lg bg-gradient-to-r from-indigo-700 via-purple-700 to-indigo-700 text-white p-3 shadow-lg text-center font-semibold text-lg sm:text-xl">
            {finalDecision}
          </div>
        )}

        <DebateLog
          log={log}
          typingLog={typingLog}
          finalDecision={finalDecision}
          topic={currentTopic}
        />
      </div>

      <button
        onClick={(e) => {
          e.stopPropagation();
          toggleSidebar();
        }}
        className="fixed bottom-6 right-6 z-[100] w-16 h-16 rounded-full bg-indigo-600 text-white shadow-lg flex items-center justify-center text-2xl hover:bg-indigo-700 transition"
        aria-label="ログ表示"
      >
        {sidebarOpen ? <X className="w-7 h-7" /> : <BookOpen className="w-7 h-7" />}
      </button>
    </main>
  );
}
