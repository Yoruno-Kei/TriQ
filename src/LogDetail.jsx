import React, { useState, useMemo, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { decompressFromEncodedURIComponent } from "lz-string";
import { AI1_CHARACTERS, AI2_CHARACTERS } from "./aiCharacters";
import ShareButtons from "./ShareButtons";
import { LogBubble, getPhase } from "./LogBubbles";


export default function LogDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [entryState, setEntryState] = useState(null);
  const [isShared, setIsShared] = useState(false);
  const [comment, setComment] = useState("");
  const [newTagInput, setNewTagInput] = useState("");

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const dataParam = searchParams.get("data");
    let foundLog = null;

  if (dataParam) {
      try {
        const decoded = JSON.parse(decompressFromEncodedURIComponent(dataParam));
        if (decoded && decoded.topic && decoded.timestamp) {
          foundLog = decoded;
          setIsShared(true);
          setEntryState(foundLog);
          setComment(decoded.comment || "");
          return;
        }
      } catch (e) {
        console.error("共有URLの復元失敗:", e);
      }
    }

    // ローカル検索にフォールバック
    const saved = JSON.parse(localStorage.getItem("triqLogs") || "[]");
    foundLog = saved.find((log) => log.id === id);
    setIsShared(false);
    setEntryState(foundLog);
    setComment(foundLog?.comment || "");
  }, [id]);

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

  const handleTagInputKeyDown = (e) => {
    if (e.key === " " || e.key === "Spacebar") {
      e.preventDefault();
      const trimmed = newTagInput.trim();
      if (trimmed.startsWith("#") && trimmed.length > 1) {
        addTag(trimmed);
        setNewTagInput("");
      }
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-950 to-gray-900 text-white p-6 pb-24 font-sans relative">
      <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 flex gap-4 z-50">
        <button onClick={handleBack} className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 rounded text-white font-semibold">ホーム</button>
        {!isShared && (
          <ShareButtons
            logData={entryState}
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
          <h2 className="text-xl font-semibold text-indigo-300 mb-4">AIキャラ選択</h2>
          <div className="flex gap-6 flex-wrap justify-center">
            {["ai1PersonaKey", "ai2PersonaKey"].map((key, i) => {
  const charKey = entryState[key];
  const label = entryState[key.replace("Key", "Label")];
  const ai = i === 0 ? "AI-1（賛成）" : "AI-2（反対）";
  const colorClass = i === 0
    ? "bg-blue-600 text-blue-100"
    : "bg-red-600 text-red-100";
  const image = (i === 0 ? AI1_CHARACTERS : AI2_CHARACTERS)[charKey]?.image;

  return (
    <div
      key={i}
      className={`p-4 rounded-xl flex-1 min-w-[160px] max-w-[240px] text-center shadow-lg ${colorClass}`}
    >
      <div className="text-white font-bold text-lg mb-2">{ai}</div>
      {image && (
        <img
          src={image}
          alt={label}
          className="w-24 h-24 mx-auto rounded-full mb-2 object-cover border-2 border-white shadow-md"
        />
      )}
      <div className="text-sm font-medium">{label || "不明"}</div>
    </div>
  );
})}
          </div>
        </section>

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
              onChange={(e) => setNewTagInput(e.target.value)}
              onKeyDown={handleTagInputKeyDown}
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
            placeholder="ここにコメントを入力"
            className="w-full p-4 rounded-lg bg-gray-800 border border-gray-700 text-white"
          />
        )}
        </section>

        {exchangeLogs.length > 0 && (
          <section>
            <h2 className="text-2xl font-semibold text-indigo-200 mb-4">🌀 応酬フェーズ</h2>
            <div className="flex flex-col">
              {exchangeLogs.map((line, idx) => (
              <LogBubble key={`exchange-${idx}`} line={line} idx={idx} />
              ))}
            </div>
          </section>
        )}

        {finalLogs.length > 0 && (
          <section>
            <h2 className="text-2xl font-semibold text-purple-300 mb-4">🧭 最終意見フェーズ</h2>
            <div className="flex flex-col">
              {finalLogs.map((line, idx) => (
              <LogBubble key={`final-${idx}`} line={line} idx={idx} />
              ))}
            </div>
          </section>
        )}

        {judgeLogs.length > 0 && (
          <section>
            <h2 className="text-2xl font-semibold text-green-400 mb-4">🏁 判定フェーズ</h2>
            <div className="flex flex-col">
              {judgeLogs.map((line, idx) => (
              <LogBubble key={`judge-${idx}`} line={line} idx={idx} />
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
