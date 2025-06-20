import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { generateGeminiResponse } from "./gemini";
import Sidebar from "./Sidebar";
import DebateLog from "./DebateLog";
import { BookOpen, X } from "lucide-react";

export default function MainPage() {
  const [topic, setTopic] = useState("");
  const [log, setLog] = useState([]);
  const [finalDecision, setFinalDecision] = useState("");
  const [savedLogs, setSavedLogs] = useState([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchKeyword, setSearchKeyword] = useState("");
  const [filter, setFilter] = useState("all");
  const [typingLog, setTypingLog] = useState(null);
  const [currentTopic, setCurrentTopic] = useState("");

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

  const clearAllLogs = () => {
    if (window.confirm("本当にすべてのログを削除しますか？")) {
      localStorage.removeItem("triqLogs");
      setSavedLogs([]);
    }
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
          setLog((prev) => [...prev, prefix + text]);
          setTypingLog(null);
          resolve();
        }
      }, delay);
    });
  };

  const handleStartDebate = async () => {
    if (!topic.trim()) return;

    setLog([]);
    setFinalDecision("");
    setCurrentTopic(topic);

    const prompt1 = `あなたはAI討論アプリの肯定役（AI-1）です。\nあなたは科学的合理主義者として、冷静に事実や論理に基づいて主張を行います。\n専門的な知見を背景に、誤解を与えず簡潔に賛成意見を述べてください（200文字以内推奨）。\n\n議題：「${topic}」`;

    await typeText("AIたちが議論中... 🤔", "", 50);
    const ai1 = await generateGeminiResponse(prompt1);
    await typeText(ai1, "🧠 AI-1（賛成）：");

    const prompt2 = `あなたはAI討論アプリの反対役（AI-2）です。\nあなたは思索的な哲学者として、前提や論理の矛盾に着目しながら反論を行います。\n相手の主張に敬意を払いながらも、深い洞察と問いかけによって意見を展開してください（200文字以内推奨）。\n\n議題：「${topic}」\nAI-1の意見：「${ai1}」`;
    const ai2 = await generateGeminiResponse(prompt2);
    await typeText(ai2, "⚖️ AI-2（反対）：");

    const prompt3a = `あなたはAI-1です。\n先ほどのAI-2の意見に対して、論理と証拠に基づき再反論してください。\n感情に流されず、専門家としての冷静な視点から答えてください（200文字以内推奨）。\n\n議題：「${topic}」\nAI-2の意見：「${ai2}」`;
    const ai3a = await generateGeminiResponse(prompt3a);
    await typeText(ai3a, "🧠 AI-1（再反論）：");

    const prompt3b = `あなたはAI-2です。\nAI-1の再反論に対し、哲学的観点から再度反論を試みてください。\n真理への問いかけを忘れず、論理の深さを意識しながら語ってください（200文字以内推奨）。\n\n議題：「${topic}」\nAI-1の再反論：「${ai3a}」`;
    const ai3b = await generateGeminiResponse(prompt3b);
    await typeText(ai3b, "⚖️ AI-2（再反論）：");

    const promptJudge = `あなたはAI討論アプリの判定役（AI-3）です。\nあなたは中立で公正な審査官として、議論全体を俯瞰し、どちらの主張がより説得力があったかを評価します。\n\nAI-1（科学的合理主義者）とAI-2（哲学的思索者）の視点を考慮し、最終的な判定を200文字以内で述べてください。\nどちらの立場に賛成するかを必ず明示してください。\n\n議題：「${topic}」\nAI-1の意見：「${ai1}」\nAI-2の意見：「${ai2}」\nAI-1の再反論：「${ai3a}」\nAI-2の再反論：「${ai3b}」`;
    const aiJudge = await generateGeminiResponse(promptJudge);
    await typeText(aiJudge, "🧩 AI-3（判定）：");

    const winner =
      /AI-1.*賛成/.test(aiJudge)
        ? "AI-1（賛成）の意見に賛成"
        : /AI-2.*賛成/.test(aiJudge)
        ? "AI-2（反対）の意見に賛成"
        : "判定不能";

    setFinalDecision(`🏁 結論：${winner}`);

    const newLog = {
      id: crypto.randomUUID(),
      topic,
      tags: [],
      log: [`🧠 ${ai1}`, `⚖️ ${ai2}`, `🧠 ${ai3a}`, `⚖️ ${ai3b}`, `🧩 ${aiJudge}`],
      winner,
      comment: "",
      timestamp: new Date().toISOString(),
    };

    const logs = JSON.parse(localStorage.getItem("triqLogs") || "[]");
    logs.push(newLog);
    localStorage.setItem("triqLogs", JSON.stringify(logs));
    setSavedLogs(logs);
    setTopic("");
  };

  return (
    <main
      className="min-h-screen bg-gradient-to-br from-gray-950 via-slate-900 to-gray-800 text-white p-6 font-sans relative"
      onClick={handleMainClick}
    >
      {/* Sidebar */}
      <Sidebar
        sidebarOpen={sidebarOpen}
        closeSidebar={closeSidebar}
        savedLogs={savedLogs}
        filteredLogs={savedLogs.filter((log) => {
          const keywordMatch = log.topic.includes(searchKeyword);
          const filterMatch =
            filter === "all"
              ? true
              : log.winner.includes(
                  filter === "pro"
                    ? "賛成"
                    : filter === "con"
                    ? "反対"
                    : "判定不能"
                );
          return keywordMatch && filterMatch;
        })}
        searchKeyword={searchKeyword}
        setSearchKeyword={setSearchKeyword}
        filter={filter}
        setFilter={setFilter}
        deleteLog={deleteLog}
        navigate={navigate}
      />

      <div
        className="max-w-[min(600px,90vw)] mx-auto pt-6 relative z-10"
        onClick={(e) => e.stopPropagation()}
      ></div>

      {/* 入力・ボタン・議題 */}
      <div className="max-w-[min(600px,90vw)] mx-auto pt-6">
        <input
          className="w-full p-4 rounded bg-gray-900 text-white text-lg mb-4 placeholder-gray-500 border border-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          type="text"
          placeholder="議題を入力..."
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
        />
        <button
          onClick={handleStartDebate}
          className="w-full p-4 rounded bg-gradient-to-r from-indigo-600 to-purple-700 text-white text-xl font-bold hover:opacity-90 transition"
          disabled={!topic.trim()}
        >
          🚀 討論を開始
        </button>

        {currentTopic && (
          <div className="text-center text-indigo-300 mt-4 select-text">
            現在の議題：{"「" + currentTopic + "」"}
          </div>
        )}

        <DebateLog
          log={log}
          typingLog={typingLog}
          finalDecision={finalDecision}
          topic={currentTopic}
        />
      </div>

      {/* ログ表示トグルボタンは常に固定表示 */}
      <button
        onClick={(e) => {
          e.stopPropagation(); // クリックが親に伝播し閉じないように
          toggleSidebar();
        }}
        className="fixed bottom-6 right-6 z-60 w-16 h-16 rounded-full bg-indigo-600 text-white shadow-lg flex items-center justify-center text-2xl hover:bg-indigo-700 transition"
        aria-label="ログ表示"
      >
        {/* サイドバー開閉でアイコン切り替え */}
        {sidebarOpen ? (
          <X className="w-7 h-7" />
        ) : (
          <BookOpen className="w-7 h-7" />
        )}
      </button>
    </main>
  );
}
