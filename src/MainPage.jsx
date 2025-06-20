import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { generateGeminiResponse } from "./gemini";
import Sidebar from "./Sidebar";
import DebateLog from "./DebateLog";
import { BookOpen, X } from "lucide-react";

export default function MainPage() {
  const [topic, setTopic] = useState("");
  const [turns, setTurns] = useState(4); // 応酬回数（最低4）
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
      setTypingLog(prefix + output); // 今の発言（入力中）をセット
      i++;
      if (i >= text.length) {
        clearInterval(interval);
        setLog((prev) => [...prev, prefix + text]); // 完了時にlogに追加
        setTypingLog(null); // 入力中表示リセット
        resolve();
      }
    }, delay);
  });
};

// 2. handleStartDebate内の記録管理をログ中心に

const handleStartDebate = async () => {
  if (!topic.trim()) return;
  if (turns < 4) {
    alert("応酬回数は最低4回に設定してください");
    return;
  }

  setIsDebating(true);
  setLog([]);
  setFinalDecision("");
  setCurrentTopic(topic);

  const ai1History = [];
  const ai2History = [];

  // 初回AI-1
  let ai1 = (
    await generateGeminiResponse(
     `あなたはAI討論アプリの肯定役（AI-1）です。\nあなたは科学的合理主義者として、冷静に事実や論理に基づいて主張を行います。\n専門的な知見を背景に、誤解を与えず簡潔に賛成意見を述べてください（100文字以内）。\n\n議題：「${topic}」`
    )
  )
    .trim()
    .slice(0, 100);
  ai1History.push(ai1);
  await typeText(ai1, "🧠 AI-1（賛成）：");

  // 初回AI-2
  let ai2 = (
    await generateGeminiResponse(
      `あなたはAI討論アプリの反対役（AI-2）です。\nあなたは思索的な哲学者として、前提や論理の矛盾に着目しながら反論を行います。\n相手の主張に敬意を払いながらも、深い洞察と問いかけによって意見を展開してください（100文字以内）。\n\n議題：「${topic}」\nAI-1の意見：「${ai1}」`
    )
  )
    .trim()
    .slice(0, 100);
  ai2History.push(ai2);
  await typeText(ai2, "⚖️ AI-2（反対）：");

  // 応酬フェーズ
  for (let i = 0; i < turns - 2; i++) {
    if (i % 2 === 0) {
      // AI-1応酬
      const latestAi2 = ai2History[ai2History.length - 1];
      const prompt = `あなたはAI討論アプリの肯定役（AI-1）です。\n先ほどのAI-2の意見に対して、論理と証拠に基づき再反論してください。\n感情に流されず、専門家としての冷静な視点から答えてください（100文字以内）。\n議題：「${topic}」\nAI-2の意見：「${latestAi2}」`;
      ai1 = (await generateGeminiResponse(prompt)).trim().slice(0, 100);
      ai1History.push(ai1);
      await typeText(ai1, "🧠 AI-1（再反論）：");
    } else {
      // AI-2応酬
      const latestAi1 = ai1History[ai1History.length - 1];
      const prompt = `あなたはAI討論アプリの反対役（AI-2）です。\nAI-1の再反論に対し、哲学的観点から再度反論を試みてください。\n真理への問いかけを忘れず、論理の深さを意識しながら語ってください（100文字以内）。\n議題：「${topic}」\nAI-1の意見：「${latestAi1}」`;
      ai2 = (await generateGeminiResponse(prompt)).trim().slice(0, 100);
      ai2History.push(ai2);
      await typeText(ai2, "⚖️ AI-2（再反論）：");
    }
  }

  // 最終意見（要約＋追加意見）各200文字以内
  const summary1 = ai1History.join(" / ");
  let finalAI1 = (
    await generateGeminiResponse(
      `あなたはAI討論アプリの肯定役（AI-1）です。以下はこれまでの自分の意見の流れです：「${summary1}」\nこれらを要約し、最後に追加したい意見を含めて200文字以内で最終的な見解を述べてください。\n議題：「${topic}」`
    )
  )
    .trim()
    .slice(0, 200);
  await typeText(finalAI1, "🧠 AI-1（最終意見）：");

  const summary2 = ai2History.join(" / ");
  let finalAI2 = (
    await generateGeminiResponse(
      `あなたはAI討論アプリの反対役（AI-2）です。以下はこれまでの自分の意見の流れです：「${summary2}」\nこれらを要約し、最後に追加したい意見を含めて200文字以内で最終的な見解を述べてください。\n議題：「${topic}」`
    )
  )
    .trim()
    .slice(0, 200);
  await typeText(finalAI2, "⚖️ AI-2（最終意見）：");

  // 判定 AI-3
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

  // スコア抽出
  const scoreMatch = aiJudge.match(/スコア[:：]\s*([1-5])/);
  const score = scoreMatch ? parseInt(scoreMatch[1]) : 3;

  // 説明抽出
  const explanationMatch = aiJudge.match(/説明[:：]\s*([\s\S]+)/);
  const aiJudgeText = explanationMatch ? explanationMatch[1].trim() : "";

  await typeText(aiJudgeText, "🧩 AI-3（判定）：");

  // 結論決定
  let winner;
  switch (score) {
    case 1:
      winner = "AI-1（賛成）の意見に賛成";
      break;
    case 2:
      winner = "AI-1（賛成）の意見にやや賛成";
      break;
    case 3:
      winner = "判定不能（引き分け）";
      break;
    case 4:
      winner = "AI-2（反対）の意見にやや賛成";
      break;
    case 5:
      winner = "AI-2（反対）の意見に賛成";
      break;
    default:
      winner = "判定不能";
  }
  setFinalDecision(`🏁 結論：${winner}`);

  // ログ保存
  const newLog = {
    id: crypto.randomUUID(),
    topic,
    tags: [],
    log,
    winner,
    comment: "",
    timestamp: new Date().toISOString(),
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
              : log.winner.includes(
            filter === "pro"
              ? "賛成"
              : filter === "con"
              ? "反対"
              : "判定不能"
          );
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
