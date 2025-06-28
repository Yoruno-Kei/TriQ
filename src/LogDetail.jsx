import React, { useState, useMemo, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { AI1_CHARACTERS, AI2_CHARACTERS } from "./aiCharacters";
import ShareButtons from "./ShareButtons";
import { LogBubble, getPhase } from "./LogBubbles";
import { getLogFromFirestore } from "./firestoreUtils";


export default function LogDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [entryState, setEntryState] = useState(null);
  const [isShared, setIsShared] = useState(false);
  const [comment, setComment] = useState("");
  const [newTagInput, setNewTagInput] = useState("");
  const [finalDecision, setFinalDecision] = useState("");
  const [firestoreId, setFirestoreId] = useState(null);


  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;

      // Firestore形式IDは短い（例: 20文字以下）
      if (id.length <= 20) {
        try {
          const doc = await getLogFromFirestore(id);
          if (doc) {
            setIsShared(true);
            setEntryState(doc);
            setComment(doc.comment || "");
            setFirestoreId(id);
            return;
          }
        } catch (e) {
          console.error("Firestoreログ取得失敗:", e);
        }
      }

      // ローカル保存はUUIDの長いID
      const saved = JSON.parse(localStorage.getItem("triqLogs") || "[]");
      const found = saved.find((log) => log.id === id);
      setIsShared(false);
      setEntryState(found);
      setComment(found?.comment || "");
    };

    fetchData();
    
  }, [id]);

  useEffect(() => {
  if (entryState?.winner) {
    setFinalDecision(`🏁 結論：${entryState.winner}`);
  }
}, [entryState]);

  const saveEntry = (newEntry) => {
    const logs = JSON.parse(localStorage.getItem("triqLogs") || "[]");
    const updatedLogs = logs.map((log) => (log.id === newEntry.id ? newEntry : log));
    localStorage.setItem("triqLogs", JSON.stringify(updatedLogs));
    setEntryState(newEntry);
  };

  const handleCommentChange = (e) => {
    const filtered = e.target.value.replace(/#/g, "");
    setComment(filtered);
    if (!entryState || isShared) return;
    saveEntry({ ...entryState, comment: filtered });
  };

  const addTag = (tagText) => {
    if (!entryState || isShared) return;
    const tag = tagText.trim().replace(/^#/, "");
    if (!tag || entryState.tags?.includes(tag)) return;
    saveEntry({ ...entryState, tags: [...(entryState.tags || []), tag] });
  };

  const removeTag = (tagToRemove) => {
    if (!entryState || !entryState.tags || isShared) return;
    saveEntry({
      ...entryState,
      tags: entryState.tags.filter((t) => t !== tagToRemove),
    });
  };

const handleTagInputChange = (e) => {
  const value = e.target.value;

  // 最後の1文字が全角スペース or 半角スペース
  if (value.endsWith(" ") || value.endsWith("　")) {
    const trimmed = value.trim(); // 両端のスペース削除
    if (trimmed.startsWith("#") && trimmed.length > 1) {
      addTag(trimmed);
    }
    setNewTagInput(""); // 入力欄をクリア
  } else {
    setNewTagInput(value);
  }
};

  const handleBack = () => navigate("/");

  const exchangeLogs = useMemo(() => entryState?.log?.filter((l) => getPhase(l) === "exchange") || [], [entryState]);
  const finalLogs = useMemo(() => entryState?.log?.filter((l) => getPhase(l) === "final") || [], [entryState]);
  const judgeLogs = useMemo(() => entryState?.log?.filter((l) => getPhase(l) === "judge") || [], [entryState]);

  if (!entryState) {
    return (
      <div className="min-h-screen flex items-center justify-center text-white p-6">
        <div>
          <p className="text-red-400 text-xl mb-4">ログが見つかりません。</p>
          <button
            onClick={handleBack}
            className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 rounded text-white font-semibold"
          >
            ホームへ戻る
          </button>
        </div>
      </div>
    );
  }

  function renderSideCard(side, entryState) {
  const isPro = side === "pro";
  const isUser = entryState.userDebateMode && entryState.userSide === side;

  const personaKey = isPro ? entryState.ai1PersonaKey : entryState.ai2PersonaKey;
  const personaLabel = isPro ? entryState.ai1PersonaLabel : entryState.ai2PersonaLabel;
  const aiChar = (isPro ? AI1_CHARACTERS : AI2_CHARACTERS)[personaKey];

  const topLabel = entryState.userDebateMode
    ? `${isPro ? "賛成" : "反対"}（${isUser ? "あなた" : "AI"}）`
    : `${isPro ? "賛成" : "反対"}（${isPro ? "AI-1" : "AI-2"}）`;

  const colorClass = isUser
    ? "bg-yellow-400 text-gray-900"
    : isPro
      ? "bg-blue-600 text-white"
      : "bg-red-600 text-white";

  return (
    <div
      key={side}
      className={`p-4 rounded-xl min-w-[160px] max-w-[240px] text-center shadow-lg ${colorClass}`}
    >
      <div className="font-bold text-lg mb-2">{topLabel}</div>

      {isUser ? (
        <div className="w-24 h-24 mx-auto rounded-full bg-yellow-300 text-gray-900 flex items-center justify-center text-lg font-bold shadow-md mb-2">
          YOU
        </div>
      ) : aiChar?.image ? (
        <img
          src={aiChar.image}
          alt={personaLabel}
          className="w-24 h-24 mx-auto rounded-full mb-2 object-cover border-2 border-white shadow-md"
        />
      ) : (
        <div className="w-24 h-24 mx-auto rounded-full bg-gray-700 flex items-center justify-center text-white text-xl font-bold mb-2">
          AI
        </div>
      )}

      {!isUser && (
        <div className="text-sm font-medium mt-1">{personaLabel || "不明"}</div>
      )}
    </div>
  );
}


  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-950 to-gray-900 text-white p-6 pb-24 font-sans relative">
      <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 flex gap-4 z-50">
        <button onClick={handleBack} className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 rounded text-white font-semibold">ホーム</button>
        {!isShared && (
      <ShareButtons
        logData={entryState}
        firestoreId={firestoreId}
        onSaved={(newId) => setFirestoreId(newId)}  // 共有後にIDを更新
        title={`TriQ議論：「${entryState.topic}」`}
      />
    )}
      </div>

      <div className="max-w-3xl mx-auto space-y-8">
        <section>
          <h2 className="text-3xl font-bold text-indigo-300 mb-3">議題</h2>
          <div className="bg-gray-800 p-6 rounded-lg text-lg border border-gray-700 whitespace-pre-wrap">
            {entryState.topic}
          </div>
        </section>

        <section className="mb-6">
          <div className="flex justify-center items-center gap-8 flex-wrap">
            {/* 賛成カード */}
            {renderSideCard("pro", entryState)}

            <div
              className="text-gray-300 font-extrabold text-6xl select-none px-6"
              style={{
                transform: "rotate(-15deg)",
                textShadow: "1px 1px 6px rgba(0, 0, 0, 0.7)",
                margin: "0 20px",
                userSelect: "none",
              }}
            >
              VS
            </div>
            {/* 反対カード */}
            {renderSideCard("con", entryState)}
          </div>
        </section>

        {finalDecision && (
          <div className="mt-3 max-w-md mx-auto rounded-lg bg-gradient-to-r from-indigo-700 via-purple-700 to-indigo-700 text-white p-3 shadow-lg text-center font-semibold text-lg sm:text-xl">
            {finalDecision}
          </div>
        )}


        {entryState.decidedFirstTurn && (
          <div className="mt-3 text-center text-indigo-300 font-semibold text-lg">
            先攻：
            {entryState.userDebateMode ? (
              entryState.decidedFirstTurn === "pro"
                ? entryState.userSide === "pro"
                  ? "賛成（あなた）"
                  : "賛成（AI）"
                : entryState.userSide === "con"
                  ? "反対（あなた）"
                  : "反対（AI）"
            ) : entryState.decidedFirstTurn === "pro"
              ? "賛成（AI-1）"
              : "反対（AI-2）"}
          </div>
        )}
        

        {entryState.tags?.length > 0 && (
        <section>
          <h2 className="text-xl font-semibold text-indigo-300 mb-2">タグ</h2>
          {entryState.tags?.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {entryState.tags.map((tag, idx) => (
                <span key={idx} className="inline-flex items-center bg-indigo-700 text-white px-3 py-1 rounded-full text-sm font-medium select-none">
                  #{tag}
                  {!isShared && (
                    <button onClick={() => removeTag(tag)} className="ml-2 text-indigo-200 hover:text-white font-bold">×</button>
                  )}
                </span>
              ))}
            </div>
          ) : (
            <div className="text-gray-500 text-sm">タグなし</div>
          )}
        </section>
        )}

        {!isShared && (
          <section>
            <h2 className="text-xl font-semibold text-indigo-300 mb-2">タグ追加</h2>
            <input
              type="text"
              value={newTagInput}
              onChange={handleTagInputChange}
              placeholder="#タグを入力してSpace"
              className="w-full p-2 rounded bg-gray-800 border border-indigo-600 text-white placeholder-gray-400"
            />
          </section>
        )}

        <section>
          <h2 className="text-2xl font-semibold text-indigo-200 mb-4">コメント</h2>
        {isShared ? (
          <div className="p-4 bg-gray-900 text-white border border-gray-800 rounded-lg text-base whitespace-pre-wrap">
            {comment.trim() ? comment : <span className="text-gray-500">コメントなし</span>}
          </div>
        ) : (
          <textarea
            rows={4}
            value={comment}
            onChange={handleCommentChange}
            placeholder="ここにコメントを入力(自動保存)"
            className="w-full p-4 rounded-lg bg-gray-800 border border-gray-700 text-white"
          />
        )}
        </section>

        {exchangeLogs.length > 0 && (
          <section>
            <h2 className="text-2xl font-semibold text-indigo-200 mb-4">🌀 応酬フェーズ</h2>
            <div className="flex flex-col">
              {exchangeLogs.map((line, idx) => (
               <LogBubble key={idx} line={line} userSide={entryState.userSide} />
              ))}
            </div>
          </section>
        )}

        {finalLogs.length > 0 && (
          <section>
            <h2 className="text-2xl font-semibold text-purple-300 mb-4">🧭 最終意見フェーズ</h2>
            <div className="flex flex-col">
              {finalLogs.map((line, idx) => (
              <LogBubble key={idx} line={line} userSide={entryState.userSide} />
              ))}
            </div>
          </section>
        )}

        {judgeLogs.length > 0 && (
          <section>
            <h2 className="text-2xl font-semibold text-green-400 mb-4">🏁 判定フェーズ</h2>
            <div className="flex flex-col">
              {judgeLogs.map((line, idx) => (
              <LogBubble key={idx} line={line} userSide={entryState.userSide} />
              ))}
            </div>
          </section>
        )}

        <div className="text-sm text-gray-400 text-right">
          保存日時：{new Date(entryState.timestamp).toLocaleString()}
        </div>
      </div>
    </div>
  );
}
