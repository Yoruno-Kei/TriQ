import React, { useState, useEffect, useRef} from "react";
import { useNavigate } from "react-router-dom";
import { generateGeminiResponseWithRetry, getCurrentGeminiModel, tryRestoreGemini25 } from "./geminiWithRetry";
import Sidebar from "./Sidebar";
import DebateLog from "./DebateLog";
import { BookOpen, X } from "lucide-react";
import { AI1_CHARACTERS, AI2_CHARACTERS } from "./aiCharacters";
import CharacterSlider from "./CharacterSlider";
import StartDebateButton from "./StartDebateButton";
import { buildPrompt } from "./generatePrompt";

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
  const [ai1Persona, setAi1Persona] = useState("AIpropose");
  const [ai2Persona, setAi2Persona] = useState("AIpropose");
  const [currentModel, setCurrentModel] = useState(getCurrentGeminiModel());

  const logRef = useRef([]);
  const ai1ScrollRef = useRef(null);
  const ai2ScrollRef = useRef(null);

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

   useEffect(() => {
    // 2分ごとに2.5モデル復帰試行
    const interval = setInterval(async () => {
      await tryRestoreGemini25();
      setCurrentModel(getCurrentGeminiModel()); // 状態更新してUI反映
    }, 120000); // 120000ms = 2分

    // コンポーネントアンマウント時にクリア
    return () => clearInterval(interval);
  }, []);

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

    const summary1 = ai1History.join(" / "); // AI-1の意見履歴
    const summary2 = ai2History.join(" / "); // AI-2の意見履歴

    const ai1Intro = await generateGeminiResponseWithRetry(
      buildPrompt({
        role: "AI-1",
        stance: "議題に賛成",
        persona: ai1Prompts.personality,
        type: "intro",
        topic,
        limit: "100",
        summary: summary1
      })
    );

    ai1History.push(ai1Intro.trim());
    await typeText(ai1Intro.trim(), "🧠 AI-1（賛成）：");

    const ai2Intro = await generateGeminiResponseWithRetry(
      buildPrompt({
        role: "AI-2",
        stance: "議題に反対",
        persona: ai2Prompts.personality,
        type: "intro",
        topic,
        limit: "100",
        opponent: ai1Intro.trim(),
        summary: summary2
      })
    );

    ai2History.push(ai2Intro.trim());
    await typeText(ai2Intro.trim(), "⚖️ AI-2（反対）：");

    for (let i = 0; i < turns - 2; i++) {
      if (i % 2 === 0) {
        const prompt = buildPrompt({
          role: "AI-1",
          stance: "議題に賛成",
          persona: ai1Prompts.personality,
          type: "rebuttal",
          topic,
          limit: "100",
          opponent: ai2History.at(-1),
          summary: summary1
        });
        const response = await generateGeminiResponseWithRetry(prompt);
        ai1History.push(response.trim());
        await typeText(response.trim(), "🧠 AI-1（再反論）：");
      } else {
        const prompt = buildPrompt({
          role: "AI-2",
          stance: "議題に反対",
          persona: ai2Prompts.personality,
          type: "rebuttal",
          topic,
          limit: "100",
          opponent: ai1History.at(-1),
          summary: summary2
        });
        const response = await generateGeminiResponseWithRetry(prompt);
        ai2History.push(response.trim());
        await typeText(response.trim(), "⚖️ AI-2（再反論）：");
      }
    }
  
    const finalAI1 = (
      await generateGeminiResponseWithRetry(
        buildPrompt({
          role: "AI-1",
          stance: "議題に賛成",
          persona: ai1Prompts.personality,
          type: "final",
          topic,
          limit: "150",
          summary: summary1
        })
      )
    ).trim();

    await typeText(finalAI1, "🧠 AI-1（最終意見）：");

    const finalAI2 = (
      await generateGeminiResponseWithRetry(
        buildPrompt({
          role: "AI-2",
          stance: "議題に反対",
          persona: ai2Prompts.personality,
          type: "final",
          topic,
          limit: "150",
          summary: summary2
        })
      )
    ).trim();

    await typeText(finalAI2, "⚖️ AI-2（最終意見）：");

    
    const promptJudge = `あなたはAI討論アプリの判定役（AI-3）です。
      あなたは中立で公正な審査官として、議論全体を俯瞰し、どちらの主張がより説得力があったかを評価します。

      まず、1〜5の数字だけを出力してください：
      1 = AI-1（賛成）の意見に完全に賛成
      2 = AI-1にやや賛成
      3 = AI-2にやや賛成
      4 = AI-2（反対）の意見に完全に賛成

      続いて、200文字以内で理由を述べてください。

      フォーマット：
      スコア: [1-4]
      説明: [理由]

      議題：「${topic}」
      AI-1の意見：「${ai1History[ai1History.length - 1]}」
      AI-2の意見：「${ai2History[ai2History.length - 1]}」`;

    const aiJudge = await generateGeminiResponseWithRetry(promptJudge);
    const scoreMatch = aiJudge.match(/スコア[:：]\s*([1-4])/);
    const score = scoreMatch ? parseInt(scoreMatch[1]) : 3;
    const explanationMatch = aiJudge.match(/説明[:：]\s*([\s\S]+)/);
    const aiJudgeText = explanationMatch ? explanationMatch[1].trim() : "";
    await typeText(aiJudgeText, "🧩 AI-3（判定）：");

    const winnerMap = {
      1: "AI-1（賛成）の意見に賛成",
      2: "AI-1（賛成）の意見にやや賛成",
      3: "AI-2（反対）の意見にやや賛成",
      4: "AI-2（反対）の意見に賛成"
    };
    setFinalDecision(`🏁 結論：${winnerMap[score] || "判定不能"}`);

    const newLog = {
      id: crypto.randomUUID(),
      topic,
      tags: [],
      log: logRef.current,
      winner: winnerMap[score] || "判定不能",
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
       
        <CharacterSlider
          title="AI-1（賛成役）を選ぶ"
          characters={AI1_CHARACTERS}
          selectedKey={ai1Persona}
          setSelectedKey={setAi1Persona}
          scrollRef={ai1ScrollRef}
        />


        <CharacterSlider
          title="AI-2（反対役）を選ぶ"
          characters={AI2_CHARACTERS}
          selectedKey={ai2Persona}
          setSelectedKey={setAi2Persona}
          scrollRef={ai2ScrollRef}
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

        <StartDebateButton
          disabled={!topic.trim() || isDebating}
          onClick={handleStartDebate}
          isDebating={isDebating}
        />

        <div className="fixed bottom-2 left-2 text-xs text-gray-400 select-none pointer-events-none">
          使用モデル: Gemini {currentModel}
        </div>

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
