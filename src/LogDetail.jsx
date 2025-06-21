import React, { useState, useMemo, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";

export default function LogDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  // logsをstate管理する
  const [logsState, setLogsState] = useState(() =>
    JSON.parse(localStorage.getItem("triqLogs") || "[]")
  );

  // entryStateはlogsStateとidに依存して設定
  const [entryState, setEntryState] = useState(() =>
    logsState.find((log) => log.id?.trim() === id?.trim())
  );

  // idかlogsStateが変わったらentryStateを更新
  useEffect(() => {
    const found = logsState.find((log) => log.id?.trim() === id?.trim());
    setEntryState(found);
  }, [id, logsState]);

  // コメント用state
  const [comment, setComment] = useState(entryState?.comment || "");

  // コメントがentryState変化で変わったら反映
  useEffect(() => {
    setComment(entryState?.comment || "");
  }, [entryState]);

  // 新規タグ入力用state
  const [newTagInput, setNewTagInput] = useState("");

  // コメント欄の変更（#除去）
  const handleCommentChange = (e) => {
    const filtered = e.target.value.replace(/#/g, "");
    setComment(filtered);

    if (!entryState) return;
    const newEntry = { ...entryState, comment: filtered };
    const newLogs = logsState.map((log) =>
      log.id === newEntry.id ? newEntry : log
    );
    setEntryState(newEntry);
    setLogsState(newLogs);
    localStorage.setItem("triqLogs", JSON.stringify(newLogs));
  };

  // タグ追加
  const addTag = (tagText) => {
    if (!entryState) return;
    const tag = tagText.trim().replace(/^#/, "");
    if (!tag) return;
    if (!entryState.tags) entryState.tags = [];
    if (entryState.tags.includes(tag)) return;

    const newTags = [...entryState.tags, tag];
    const newEntry = { ...entryState, tags: newTags };
    const newLogs = logsState.map((log) =>
      log.id === newEntry.id ? newEntry : log
    );

    setEntryState(newEntry);
    setLogsState(newLogs);
    localStorage.setItem("triqLogs", JSON.stringify(newLogs));
  };

  // タグ削除
  const removeTag = (tagToRemove) => {
    if (!entryState || !entryState.tags) return;

    const newTags = entryState.tags.filter((t) => t !== tagToRemove);
    const newEntry = { ...entryState, tags: newTags };
    const newLogs = logsState.map((log) =>
      log.id === newEntry.id ? newEntry : log
    );

    setEntryState(newEntry);
    setLogsState(newLogs);
    localStorage.setItem("triqLogs", JSON.stringify(newLogs));
  };

  // 新タグ入力欄Enter時
  const handleTagInputKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (newTagInput.startsWith("#")) {
        addTag(newTagInput);
        setNewTagInput("");
      }
    }
  };

  // 戻るボタンは必ずホームへ遷移
  const handleBack = () => {
    navigate("/");
  };

  if (!entryState) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-950 to-gray-900 text-white flex flex-col justify-center items-center p-6">
        <p className="text-red-400 font-semibold text-lg mb-6">ログが見つかりません。</p>
        <button
          onClick={handleBack}
          className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 rounded text-white font-semibold"
        >
          戻る
        </button>
      </div>
    );
  }

  // 発言種別の判定関数などは元のままでOK
  const getPhase = (line) => {
    if (
      line.startsWith("🧠 AI-1（最終意見）：") ||
      line.startsWith("⚖️ AI-2（最終意見）：")
    ) {
      return "final";
    }
    if (line.startsWith("🧩")) return "judge";
    return "exchange";
  };

  const getSpeaker = (line) => {
    if (line.startsWith("🧠")) return "ai1";
    if (line.startsWith("⚖️")) return "ai2";
    if (line.startsWith("🧩")) return "judge";
    return "other";
  };

  const highlightTags = (text) => {
    const regex = /(#\S+?)(?=\s|$|[.,!?"'“”‘’])/g;
    const parts = [];
    let lastIndex = 0;
    let match;

    while ((match = regex.exec(text)) !== null) {
      if (match.index > lastIndex) {
        parts.push(text.substring(lastIndex, match.index));
      }
      parts.push(
        <span
          key={match.index}
          className="inline-block bg-indigo-600 text-white px-2 py-0.5 rounded-full text-xs font-bold mr-1 select-none"
        >
          {match[1]}
        </span>
      );
      lastIndex = match.index + match[1].length;
    }
    if (lastIndex < text.length) {
      parts.push(text.substring(lastIndex));
    }
    return parts;
  };

  const exchangeLogs = useMemo(() => {
    if (!entryState || !Array.isArray(entryState.log)) return [];
    return entryState.log.filter((l) => getPhase(l) === "exchange");
  }, [entryState]);

  const finalLogs = useMemo(() => {
    if (!entryState || !Array.isArray(entryState.log)) return [];
    return entryState.log.filter((l) => getPhase(l) === "final");
  }, [entryState]);

  const judgeLogs = useMemo(() => {
    if (!entryState || !Array.isArray(entryState.log)) return [];
    return entryState.log.filter((l) => getPhase(l) === "judge");
  }, [entryState]);

  const renderBubble = (line, idx) => {
    const speaker = getSpeaker(line);
    const clean = line.replace(
      /^🧠 AI-1（最終意見）：|^🧠 |^⚖️ AI-2（最終意見）：|^⚖️ |^🧩 /,
      ""
    );

    const baseClasses =
      "max-w-[90%] p-5 rounded-xl shadow-md mb-4 whitespace-pre-wrap break-words";
    let bubbleClass = "";
    let containerClass = "flex ";
    let label = "";

    switch (speaker) {
      case "ai1":
        bubbleClass = "bg-blue-100 text-gray-900 border border-blue-300";
        containerClass += "justify-start";
        label = "🧠 AI-1（賛成）";
        break;
      case "ai2":
        bubbleClass = "bg-red-100 text-gray-900 border border-red-300";
        containerClass += "justify-end";
        label = "⚖️ AI-2（反対）";
        break;
      case "judge":
        bubbleClass = "bg-green-100 text-gray-900 border border-green-300";
        containerClass += "justify-center";
        label = "🧩 AI-3（判定）";
        break;
      default:
        bubbleClass = "bg-gray-200 text-gray-900 border border-gray-300";
        containerClass += "justify-start";
        label = "AI";
    }

    return (
      <div key={idx} className={containerClass}>
        <div className={`${baseClasses} ${bubbleClass}`}>
          <div className="font-semibold opacity-80 mb-1 select-none">{label}</div>
          <div>{highlightTags(clean)}</div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-950 to-gray-900 text-white p-6 pb-24 font-sans relative">
      <button
        onClick={handleBack}
        className="fixed bottom-4 left-1/2 transform -translate-x-1/2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 rounded text-white font-semibold z-50"
      >
        ← 戻る
      </button>

      <div className="max-w-3xl mx-auto space-y-8">
        <section>
          <h2 className="text-3xl font-bold text-indigo-300 mb-3">議題</h2>
          <div className="bg-gray-800 p-6 rounded-lg text-lg border border-gray-700 whitespace-pre-wrap">
            {entryState.topic}
          </div>
        </section>

        <section className="mb-6">
  <h2 className="text-xl font-semibold text-indigo-300 mb-2">AIキャラ選択</h2>
  <div className="flex gap-6">
    <div className="bg-blue-600 p-3 rounded-lg flex-1 text-center">
      <div className="text-white font-bold text-lg mb-1">🧠 AI-1（賛成）</div>
      <div className="text-indigo-200">{entryState.ai1PersonaLabel || "不明"}</div>
    </div>
    <div className="bg-red-600 p-3 rounded-lg flex-1 text-center">
      <div className="text-white font-bold text-lg mb-1">⚖️ AI-2（反対）</div>
      <div className="text-red-200">{entryState.ai2PersonaLabel || "不明"}</div>
    </div>
  </div>
</section>

        {entryState.tags?.length > 0 && (
          <section>
            <h2 className="text-xl font-semibold text-indigo-300 mb-2">タグ</h2>
            <div className="flex flex-wrap gap-2">
              {entryState.tags.map((tag, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center bg-indigo-700 text-white px-3 py-1 rounded-full text-sm font-medium select-none"
                >
                  #{tag}
                  <button
                    onClick={() => removeTag(tag)}
                    className="ml-2 text-indigo-200 hover:text-white font-bold"
                    aria-label={`タグ ${tag} を削除`}
                    type="button"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </section>
        )}

        <section>
          <h2 className="text-xl font-semibold text-indigo-300 mb-2">
            タグ追加 (#付きで入力してEnter)
          </h2>
          <input
            type="text"
            value={newTagInput}
            onChange={(e) => setNewTagInput(e.target.value)}
            onKeyDown={handleTagInputKeyDown}
            placeholder="#タグを入力してEnter"
            className="w-full p-2 rounded bg-gray-800 border border-indigo-600 text-white placeholder-gray-400"
          />
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-indigo-200 mb-4">コメント・メモ</h2>
          <textarea
            rows={4}
            value={comment}
            onChange={handleCommentChange}
            placeholder="ここにメモを入力"
            className="w-full p-4 rounded-lg bg-gray-800 border border-gray-700 text-white"
          />
        </section>

        {exchangeLogs.length > 0 && (
          <section>
            <h2 className="text-2xl font-semibold text-indigo-200 mb-4">🌀 応酬フェーズ</h2>
            <div className="flex flex-col">{exchangeLogs.map(renderBubble)}</div>
          </section>
        )}

        {finalLogs.length > 0 && (
          <section>
            <h2 className="text-2xl font-semibold text-purple-300 mb-4">🧭 最終意見フェーズ</h2>
            <div className="flex flex-col">{finalLogs.map(renderBubble)}</div>
          </section>
        )}

        {judgeLogs.length > 0 && (
          <section>
            <h2 className="text-2xl font-semibold text-green-400 mb-4">🏁 判定フェーズ</h2>
            <div className="flex flex-col">{judgeLogs.map(renderBubble)}</div>
          </section>
        )}

        <div className="text-sm text-gray-400 text-right">
          保存日時：{new Date(entryState.timestamp).toLocaleString()}
        </div>
      </div>
    </div>
  );
}
