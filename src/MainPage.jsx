import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { generateGeminiResponse } from "./gemini";

export default function MainPage() {
  const [topic, setTopic] = useState("");
  const [log, setLog] = useState([]);
  const [finalDecision, setFinalDecision] = useState("");
  const [savedLogs, setSavedLogs] = useState([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchKeyword, setSearchKeyword] = useState("");
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    const logs = JSON.parse(localStorage.getItem("triqLogs") || "[]");
    setSavedLogs(logs);
  }, []);

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

  // 検索・フィルタ後のログ一覧
  const filteredLogs = savedLogs.filter((entry) => {
    const keywordLower = searchKeyword.toLowerCase();

    // キーワード検索（議題 or コメント or タグ含む）
    const matchesKeyword =
      entry.topic.toLowerCase().includes(keywordLower) ||
      (entry.comment && entry.comment.toLowerCase().includes(keywordLower)) ||
      (entry.tags && entry.tags.some((tag) => tag.toLowerCase().includes(keywordLower)));

    // フィルタ条件の厳密化
    let matchesFilter = true;
    if (filter === "pro") {
      // AI-1（賛成）のみ
      matchesFilter = entry.winner.includes("AI-1") && entry.winner.includes("賛成");
    } else if (filter === "con") {
      // AI-2（反対）のみ
      matchesFilter = entry.winner.includes("AI-2") && entry.winner.includes("賛成");
    } else if (filter === "undecided") {
      matchesFilter = entry.winner === "判定不能";
    }
    return matchesKeyword && matchesFilter;
  });

  const handleStartDebate = async () => {
    if (!topic.trim()) return;

    setLog([]);
    setFinalDecision("AIたちが議論中... 🤔");

    const prompt1 = `あなたはAI討論アプリの肯定役（AI-1）です。\nあなたは科学的合理主義者として、冷静に事実や論理に基づいて主張を行います。\n専門的な知見を背景に、誤解を与えず簡潔に賛成意見を述べてください（200文字以内推奨）。\n\n議題：「${topic}」`;
    const ai1 = await generateGeminiResponse(prompt1);
    setLog([`🧠 AI-1（賛成）：${ai1}`]);

    const prompt2 = `あなたはAI討論アプリの反対役（AI-2）です。\nあなたは思索的な哲学者として、前提や論理の矛盾に着目しながら反論を行います。\n相手の主張に敬意を払いながらも、深い洞察と問いかけによって意見を展開してください（200文字以内推奨）。\n\n議題：「${topic}」\nAI-1の意見：「${ai1}」`;
    const ai2 = await generateGeminiResponse(prompt2);
    setLog((prev) => [...prev, `⚖️ AI-2（反対）：${ai2}`]);

    const prompt3a = `あなたはAI-1です。\n先ほどのAI-2の意見に対して、論理と証拠に基づき再反論してください。\n感情に流されず、専門家としての冷静な視点から答えてください（200文字以内推奨）。\n\n議題：「${topic}」\nAI-2の意見：「${ai2}」`;
    const ai3a = await generateGeminiResponse(prompt3a);
    setLog((prev) => [...prev, `🧠 AI-1（再反論）：${ai3a}`]);

    const prompt3b = `あなたはAI-2です。\nAI-1の再反論に対し、哲学的観点から再度反論を試みてください。\n真理への問いかけを忘れず、論理の深さを意識しながら語ってください（200文字以内推奨）。\n\n議題：「${topic}」\nAI-1の再反論：「${ai3a}」`;
    const ai3b = await generateGeminiResponse(prompt3b);
    setLog((prev) => [...prev, `⚖️ AI-2（再反論）：${ai3b}`]);

    const promptJudge = `あなたはAI討論アプリの判定役（AI-3）です。\nあなたは中立で公正な審査官として、議論全体を俯瞰し、どちらの主張がより説得力があったかを評価します。\n\nAI-1（科学的合理主義者）とAI-2（哲学的思索者）の視点を考慮し、最終的な判定を200文字以内で述べてください。\nどちらの立場に賛成するかを必ず明示してください。\n\n議題：「${topic}」\nAI-1の意見：「${ai1}」\nAI-2の意見：「${ai2}」\nAI-1の再反論：「${ai3a}」\nAI-2の再反論：「${ai3b}」`;
    const aiJudge = await generateGeminiResponse(promptJudge);
    setLog((prev) => [...prev, `🧩 AI-3（判定）：${aiJudge}`]);

    // winner判定（元の文字列のまま）
    const winner =
      /AI-1.*賛成/.test(aiJudge) ? "AI-1（賛成）の意見に賛成" :
      /AI-2.*賛成/.test(aiJudge) ? "AI-2（反対）の意見に賛成" :
      "判定不能";

    setFinalDecision(`🏁 結論：${winner}`);

    // タグは詳細画面で管理なので空配列
    const newLog = {
      id: crypto.randomUUID(),
      topic,
      tags: [],  // タグは詳細画面で編集
      log: [
        `🧠 ${ai1}`,
        `⚖️ ${ai2}`,
        `🧠 ${ai3a}`,
        `⚖️ ${ai3b}`,
        `🧩 ${aiJudge}`
      ],
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
    <main className="relative max-w-2xl mx-auto p-4 sm:p-6">
      <aside
        className={`fixed top-0 right-0 h-screen w-full sm:w-80 bg-gray-900 text-white shadow-xl z-40 transform transition-transform duration-300 ${
          sidebarOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="p-4 sm:p-6 pt-20 h-full flex flex-col">
          <h2 className="text-2xl font-semibold mb-4 border-b border-gray-700 pb-2 flex items-center justify-between">
            <span>🗂 討論ログ</span>
          </h2>

          {/* 検索ボックス */}
          <input
            type="text"
            placeholder="議題・タグ・コメントを検索"
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
            className="w-full p-2 mb-3 rounded border border-gray-600 bg-gray-800 text-white text-sm"
            aria-label="討論ログ検索"
          />

          {/* フィルタ */}
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="w-full p-2 mb-4 rounded border border-gray-600 bg-gray-800 text-white text-sm"
            aria-label="討論ログフィルタ"
          >
            <option value="all">すべて表示</option>
            <option value="pro">賛成のみ</option>
            <option value="con">反対のみ</option>
            <option value="undecided">判定不能のみ</option>
          </select>
          <button
              onClick={() => {
                setSearchKeyword("");
                setFilter("all");
              }}
              className="text-sm text-blue-400 hover:underline"
              aria-label="検索条件リセット"
            >
              🔄 検索条件をクリア
            </button>

          <div className="flex-grow overflow-y-auto">
            {filteredLogs.length === 0 ? (
              <p className="text-gray-400">該当するログがありません。</p>
            ) : (
              <ul className="space-y-4">
                {filteredLogs.map((entry) => (
                  <li
                    key={entry.id}
                    className="relative bg-gray-800 rounded-md p-3 hover:bg-gray-700 transition cursor-pointer"
                  >
                    <button
                      onClick={() => deleteLog(entry.id)}
                      className="absolute top-2 right-2 w-8 h-8 text-red-400 hover:text-red-600"
                      title="このログを削除"
                      aria-label="このログを削除"
                    >
                      ×
                    </button>
                    <div className="text-xs text-gray-400 mb-1">
                      {new Date(entry.timestamp).toLocaleString()}
                    </div>
                    <div className="font-semibold truncate">{entry.topic}</div>
                    <div className="text-xs text-gray-300 mt-1 mb-1">
                      タグ: {entry.tags?.join(", ") || "なし"}
                    </div>
                    <div className="text-sm text-gray-300 mt-1">{entry.winner}</div>
                    <Link
                      to={`/log/${savedLogs.findIndex((log) => log.id === entry.id)}`}
                      className="text-blue-400 text-sm hover:underline mt-2 block"
                      onClick={() => setSidebarOpen(false)}
                    >
                      詳細を見る →
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div className="mt-4 border-t border-gray-700 pt-4">
            <button
              onClick={clearAllLogs}
              className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-2 rounded shadow transition"
              aria-label="すべてのログを削除"
            >
              すべてのログを削除
            </button>
          </div>
        </div>
      </aside>

      <section>
        <div className="bg-gray-800 p-4 sm:p-6 rounded-xl shadow-lg mb-6">
          <input
            className="w-full p-3 text-sm sm:text-base mb-3 text-black rounded shadow"
            type="text"
            placeholder="議題を入力してください（例：ベーシックインカムは導入すべき？）"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            onFocus={() => setSidebarOpen(false)}
            aria-label="議題入力"
        />
          <button
            onClick={handleStartDebate}
            className="w-full text-sm sm:text-base bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold py-3 px-6 rounded-xl shadow-lg transition-transform duration-150 active:scale-95"
            aria-label="討論を開始"
          >
            🚀 討論を開始
          </button>
        </div>

        <div className="space-y-4">
          {log.map((entry, idx) => (
            <div
              key={idx}
              className={`p-4 rounded-lg shadow-md max-w-[80%] ${
                entry.startsWith("🧠")
                  ? "bg-blue-100 text-gray-900 ml-0"
                  : entry.startsWith("⚖️")
                  ? "bg-red-100 text-gray-900 ml-auto"
                  : "bg-green-100 text-gray-900 mx-auto"
              }`}
            >
              {entry}
            </div>
          ))}
        </div>

        {finalDecision && (
          <div className="mt-8 bg-yellow-100 text-gray-900 border-l-4 border-yellow-500 p-4 rounded shadow">
            {finalDecision}
          </div>
        )}
      </section>

      <button
        onClick={toggleSidebar}
        aria-label={sidebarOpen ? "閉じる" : "ログ一覧を開く"}
        className="fixed top-6 right-6 z-50 w-12 h-12 rounded-full bg-gray-800 hover:bg-gray-700 text-white flex items-center justify-center shadow-lg transition"
        title={sidebarOpen ? "閉じる" : "ログ一覧を開く"}
      >
        {sidebarOpen ? (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-7 w-7"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-7 w-7"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v16a1 1 0 01-1 1H4a1 1 0 01-1-1V4z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h8M8 11h8M8 15h8" />
          </svg>
        )}
      </button>
    </main>
  );
}
