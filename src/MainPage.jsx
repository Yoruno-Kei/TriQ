import React, { useState, useEffect, useRef } from "react";
import { BookOpen, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import Sidebar from "./Sidebar";
import DebateLog from "./DebateLog";
import TurnDeciderAnimation from "./TurnDeciderAnimation";
import DebateControls from "./DebateControls";
import UserInputArea from "./UserInputArea";
import { getCurrentGeminiModel, tryRestoreGemini25 } from "./geminiWithRetry";
import { generateDebateTopic } from "./generateTopic";
import { handleStartDebate as runDebate } from "./handleStartDebate";

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
  const [ai2Persona, setAi2Persona] = useState("AIoppose");
  const [currentModel, setCurrentModel] = useState(getCurrentGeminiModel());
  const [isGeneratingTopic, setIsGeneratingTopic] = useState(false);

  const [userInput, setUserInput] = useState("");
  const [isUserTurn, setIsUserTurn] = useState(false);

  const [userDebateMode, setUserDebateMode] = useState(false);
  const [userSide, setUserSide] = useState(null);

  const [showTurnDecider, setShowTurnDecider] = useState(false);
  const [decidedFirstTurn, setDecidedFirstTurn] = useState(null);

  const [clickCount, setClickCount] = useState(0);
  const [cooldown, setCooldown] = useState(false);
  const cooldownTime = 5 * 1000;

  const logRef = useRef([]);
  const ai1ScrollRef = useRef(null);
  const ai2ScrollRef = useRef(null);

  const navigate = useNavigate();

  useEffect(() => {
    const logs = JSON.parse(localStorage.getItem("triqLogs") || "[]");
    setSavedLogs(logs);
  }, []);

  useEffect(() => {
    let timer;
    if (cooldown) {
      timer = setTimeout(() => {
        setCooldown(false);
        setClickCount(0);
      }, cooldownTime);
    }
    return () => clearTimeout(timer);
  }, [cooldown]);

  useEffect(() => {
    const interval = setInterval(async () => {
      await tryRestoreGemini25();
      setCurrentModel(getCurrentGeminiModel());
    }, 120000);
    return () => clearInterval(interval);
  }, []);

  // 議題生成
  const handleGenerateTopic = async () => {
    if (cooldown || isGeneratingTopic) return;

    if (clickCount >= 3) {
      setCooldown(true);
      return;
    }

    setClickCount((c) => c + 1);
    setIsGeneratingTopic(true);
    try {
      const allTopics = savedLogs.map((log) => log.topic);
      const recentTopics = allTopics.length > 5 ? allTopics.slice(-20) : allTopics;
      const newTopic = await generateDebateTopic(recentTopics);
      setTopic(newTopic);
    } finally {
      setIsGeneratingTopic(false);
    }
  };

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

  // ユーザー入力送信処理
  const handleUserSubmit = (text) => {
    setLog((prev) => [...prev, text]);
    logRef.current.push(text);
    setIsUserTurn(false);
  };

  // 先攻決定後の処理
  const onTurnDecided = (firstTurnSide) => {
    setDecidedFirstTurn(firstTurnSide);
    setShowTurnDecider(false);
    // 先攻側によってユーザーターンの開始判定など必要ならここに追加
  };

  // 討論開始時の処理（TurnDeciderを表示してから実際の議論開始はhandleStartDebateで）
  const handleStartDebateWithTurnDecider = () => {
    setShowTurnDecider(true);
    setDecidedFirstTurn(null);
  };

  // 実際に討論開始処理
  const handleStartDebate = (firstTurnSide) => {
    runDebate({
      topic,
      turns,
      ai1Persona,
      ai2Persona,
      typeText,
      setFinalDecision,
      setLog,
      logRef,
      setIsDebating,
      setSavedLogs,
      setTopic,
      setCurrentTopic,
      userDebateMode,
      userSide,
      onUserTurnChange: setIsUserTurn,
      firstTurnSide,
    });
  };

  // TurnDeciderが決定したら討論開始を呼ぶ
  useEffect(() => {
    if (decidedFirstTurn) {
      handleStartDebate(decidedFirstTurn);
    }
  }, [decidedFirstTurn]);

  // ユーザーの発言の接頭辞
  const userPrefix = userSide === "pro" ? "【あなた（賛成）】 " : "【あなた（反対）】 ";

  return (
    <main
      className="min-h-screen bg-gradient-to-br from-gray-950 via-slate-900 to-gray-800 text-white p-6 font-sans relative"
      onClick={handleMainClick}
    >
    {sidebarOpen && (
      <div
        className="fixed inset-0 z-40"
        onClick={() => setSidebarOpen(false)}
      >
      <Sidebar
        sidebarOpen={sidebarOpen}
        closeSidebar={() => setSidebarOpen(false)}
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
      </div>
    )}


      <div className="max-w-[min(600px,90vw)] mx-auto pt-6" onClick={(e) => e.stopPropagation()}>
        <DebateControls
          topic={topic}
          setTopic={setTopic}
          turns={turns}
          setTurns={setTurns}
          showMoreTurns={showMoreTurns}
          setShowMoreTurns={setShowMoreTurns}
          isGeneratingTopic={isGeneratingTopic}
          cooldown={cooldown}
          handleGenerateTopic={handleGenerateTopic}
          userDebateMode={userDebateMode}
          setUserDebateMode={setUserDebateMode}
          userSide={userSide}
          setUserSide={setUserSide}
          ai1Persona={ai1Persona}
          setAi1Persona={setAi1Persona}
          ai2Persona={ai2Persona}
          setAi2Persona={setAi2Persona}
          handleStartDebateWithTurnDecider={handleStartDebateWithTurnDecider}
          isDebating={isDebating}
          ai1ScrollRef={ai1ScrollRef}
          ai2ScrollRef={ai2ScrollRef}
        />

        {showTurnDecider && <TurnDeciderAnimation onDecide={onTurnDecided} />}

        {decidedFirstTurn && (
          <div className="mt-4 text-center text-indigo-300 font-semibold">
            先攻決定：{decidedFirstTurn?.label}
          </div>
        )}

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

        <DebateLog log={log} typingLog={typingLog} finalDecision={finalDecision} topic={currentTopic} />

        {isUserTurn && (
          <UserInputArea
            userInput={userInput}
            setUserInput={setUserInput}
            onSubmit={handleUserSubmit}
            userPrefix={userPrefix}
          />
        )}
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
