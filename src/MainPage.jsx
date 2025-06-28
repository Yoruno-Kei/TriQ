import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation  } from "react-router-dom";
import { Award, X } from "lucide-react";
import Sidebar from "./Sidebar";
import DebateLog from "./DebateLog";
import TurnDeciderRoulette from "./TurnDeciderAnimation";
import DebateControls from "./DebateControls";
import UserInputArea from "./UserInputArea";
import { getCurrentGeminiModel, tryRestoreGemini25 } from "./geminiWithRetry";
import { generateDebateTopic } from "./generateTopic";
import { handleStartDebate as runDebate } from "./handleStartDebate";
import ToggleSidebarButton from "./ToggleSidebarButton";
import UserStatsPanel from "./UserStatsPanel";
import EvaluationPopup from "./EvaluationPopup";

export default function MainPage() {
  const [topic, setTopic] = useState("");
  const [turns, setTurns] = useState(4);
  const [log, setLog] = useState([]);
  const [finalDecision, setFinalDecision] = useState("");
  const [savedLogs, setSavedLogs] = useState([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showStatsPanel, setShowStatsPanel] = useState(false);
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
  const [isUserInputVisible, setIsUserInputVisible] = useState(false);

  const [userDebateMode, setUserDebateMode] = useState(false);
  const [userSide, setUserSide] = useState("pro");

  const [showTurnDecider, setShowTurnDecider] = useState(false);
  const [decidedFirstTurn, setDecidedFirstTurn] = useState(null);

  const [clickCount, setClickCount] = useState(0);
  const [cooldown, setCooldown] = useState(false);
  const cooldownTime = 5 * 1000;

  const logRef = useRef([]);
  const userReplyResolver = useRef(null);

  const location = useLocation();

  const ai1ScrollRef = useRef(null);
  const ai2ScrollRef = useRef(null);

  const navigate = useNavigate();

  const [showEvaluationPopup, setShowEvaluationPopup] = useState(false);
  const [evaluationResult, setEvaluationResult] = useState(null);
  const [userEvaluationSummary, setUserEvaluationSummary] = useState("");


  const [isFinalPhase, setIsFinalPhase] = useState(false);

  const [isEvaluating, setIsEvaluating] = useState(false);

  const waitForUserReply = () => {
  return new Promise((resolve) => {
    setIsUserInputVisible(true);
    userReplyResolver.current = (text) => {
      setIsUserInputVisible(false);
      resolve(text); // 生テキストだけ返す（prefixなし）
    };
  });
};


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

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const redirectPath = params.get("redirect");
    if (redirectPath) {
      // クエリを削除しつつリダイレクト
      navigate(`/${redirectPath}`, { replace: true });
    }
  }, [location.search, navigate]);

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
        setTypingLog(null);
        resolve();
      }
    }, delay);
  });
};

  // ユーザー入力送信処理
const handleUserSubmit = (text) => {
  userReplyResolver.current?.(text); // resolveして進行
};

  // 先攻決定後の処理
  const onTurnDecided = (firstTurnSide) => {
    setDecidedFirstTurn(firstTurnSide);
    setShowTurnDecider(false);
    // 先攻側によってユーザーターンの開始判定など必要ならここに追加
  };

  // 討論開始時の処理（TurnDeciderを表示してから実際の議論開始はhandleStartDebateで）
  const handleStartDebateWithTurnDecider = () => {
  setIsDebating(true);        // ① アニメーションを即開始
  setShowTurnDecider(true);   // ② アニメーション（先攻決定）表示
  setDecidedFirstTurn(null);  // ③ リセット
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
      setIsFinalPhase,
      userDebateMode,
      userSide,
      firstTurnSide,
      waitForUserReply,
      setIsEvaluating,
      setUserEvaluationSummary,
      setEvaluationResult,
      setShowEvaluationPopup,
    });
  };

  // TurnDeciderが決定したら討論開始を呼ぶ
  useEffect(() => {
    if (decidedFirstTurn) {
      handleStartDebate(decidedFirstTurn);
    }
  }, [decidedFirstTurn]);

  return (
    <main
      className="min-h-screen bg-gradient-to-br from-gray-950 via-slate-900 to-gray-800 text-white p-6 font-sans relative"
      onClick={handleMainClick}
    >

    {/* 背景オーバーレイ（常に表示してアニメーション制御） */}
      <div
        className={`fixed inset-0 bg-black z-40 transition-opacity duration-300 ${
          sidebarOpen ? "opacity-40 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
        onClick={() => setSidebarOpen(false)}
      />

      {/* サイドバー（常に表示してスライド制御） */}
      <div
        className={`fixed top-0 right-0 h-full w-[80vw] max-w-xs bg-gray-950 text-white shadow-lg rounded-l-xl z-50 transition-transform duration-300 ease-in-out transform ${
          sidebarOpen ? "translate-x-0" : "translate-x-full"
        }`}
        onClick={(e) => e.stopPropagation()}
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
            const tagMatch =
              selectedTag === "" || (log.tags || []).includes(selectedTag);
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

      <div className="max-w-[min(600px,90vw)] mx-auto pt-6" onClick={(e) => e.stopPropagation()}>
<div
  className={`transition-all duration-300 ${
    isDebating ? "pointer-events-none opacity-50 blur-[1px]" : "pointer-events-auto opacity-100"
  }`}
>
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
</div>

        {showTurnDecider && (
          <TurnDeciderRoulette
            onDecide={onTurnDecided}
            userDebateMode={userDebateMode}
            userSide={userSide}
          />
        )}

        {decidedFirstTurn && (
          <div className="mt-4 text-center text-indigo-300 font-semibold">
            先攻：
            {userDebateMode ? (
              decidedFirstTurn === "pro"
                ? userSide === "pro"
                  ? "賛成（あなた）"
                  : "賛成（AI）"
                : userSide === "con"
                  ? "反対（あなた）"
                  : "反対（AI）"
            ) : decidedFirstTurn === "pro"
              ? "賛成（AI-1）"
              : "反対（AI-2）"}
          </div>
        )}

        <div className="fixed bottom-2 left-2 text-xs text-gray-400 select-none pointer-events-none">
          使用モデル: Gemini-{currentModel}-flash
        </div>

        {currentTopic && (
          <div className="text-center text-indigo-300 mt-4 select-text text-lg sm:text-xl font-semibold">
            現在の議題：{"「" + currentTopic + "」"}
          </div>
        )}

        {typingLog && (
          <div className="text-center mt-3 text-indigo-200 text-base sm:text-lg font-mono animate-pulse whitespace-pre-wrap">
            {typingLog}
          </div>
        )}


        {finalDecision && (
          <div className="mt-3 max-w-md mx-auto rounded-lg bg-gradient-to-r from-indigo-700 via-purple-700 to-indigo-700 text-white p-3 shadow-lg text-center font-semibold text-lg sm:text-xl">
            {finalDecision}
          </div>
        )}

        <DebateLog 
          log={log} 
          finalDecision={finalDecision} 
          topic={currentTopic} 
          isUserInputVisible={isUserInputVisible} 
          userSide={userSide}
          isDebating={isDebating} 
          />

{isUserInputVisible && (
  <UserInputArea
    isVisible={isUserInputVisible}
    isFinalPhase={isFinalPhase}
    userInput={userInput}
    setUserInput={setUserInput}
    onSubmit={handleUserSubmit}
    maxLength={isFinalPhase ? 150 : 75}
  />
)}


      </div>

{!isDebating && !showStatsPanel && (
  <ToggleSidebarButton
    sidebarOpen={sidebarOpen}
    toggleSidebar={toggleSidebar}
  />
)}

{/* ステータスボタン：サイドバー非表示時のみ出現 */}
{!sidebarOpen && (
/* ステータス表示切替ボタン（常に表示、クリックで開閉切替） */
<button
  onClick={(e) => {
    e.stopPropagation();
    setShowStatsPanel((prev) => !prev);
  }}
  className={`fixed top-4 right-4 z-50 p-2 rounded-full shadow transition
    ${showStatsPanel ? "bg-gray-800 text-gray-300 hover:text-white" : "bg-indigo-600 text-white hover:bg-indigo-700"}`}
  title={showStatsPanel ? "ステータスを閉じる" : "ステータスを見る"}
>
  {showStatsPanel ? (
    <X className="w-10 h-10" />
  ) : (
    <Award className="w-10 h-10" />
  )}
</button>
)}

{isEvaluating && !showEvaluationPopup && (
  <div className="text-center text-gray-600 mt-4 animate-pulse">
    🧠 評価中です...しばらくお待ちください
  </div>
)}

{showEvaluationPopup && evaluationResult && (
  <EvaluationPopup
    result={evaluationResult}
    onClose={() => setShowEvaluationPopup(false)}
  />
)}

{/* ステータスパネル */}
{showStatsPanel && (
  <div
    className="fixed inset-0 z-10 bg-black bg-opacity-70 backdrop-blur-sm flex items-center justify-center animate-fade-in"
    onClick={() => setShowStatsPanel(false)}
  >
    <div
      className="bg-gray-900 rounded-xl max-w-3xl w-[95%] max-h-[95vh] overflow-y-auto p-6 animate-pop"
      onClick={(e) => e.stopPropagation()}
    >
      <UserStatsPanel />
    </div>
  </div>
)}
    </main>
  );
}
