import React, { useState, useMemo, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";

export default function LogDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const logs = JSON.parse(localStorage.getItem("triqLogs") || "[]");
  const entry = logs.find((log) => String(log.id) === String(id));

  const [comment, setComment] = useState(entry?.comment || "");

  // 🔍 タグ抽出ユーティリティ
  const extractTags = (text) => {
    const matches = text.match(/#\S+?(?=\s|$|[.,!?"'“”‘’])/g) || [];
    return [...new Set(matches.map((t) => t.trim()))];
  };

  // 🔄 コメント変更時にタグを自動保存
  useEffect(() => {
    if (!entry) return;
    const updatedTags = extractTags(comment);
    entry.comment = comment;
    entry.tags = updatedTags;

    const index = logs.findIndex((log) => log.id === id);
    if (index !== -1) {
      logs[index] = entry;
      localStorage.setItem("triqLogs", JSON.stringify(logs));
    }
  }, [comment]);

  if (!entry) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-950 to-gray-900 text-white flex flex-col justify-center items-center p-6">
        <p className="text-red-400 font-semibold text-lg mb-6">ログが見つかりません。</p>
        <button
          onClick={() => navigate(-1)}
          className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 rounded text-white font-semibold"
        >
          戻る
        </button>
      </div>
    );
  }

  // 🧠 発言種別の判定
  const getPhase = (line) => {
    if (line.startsWith("🧠 AI-1（最終意見）：") || line.startsWith("⚖️ AI-2（最終意見）：")) {
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

  // 🌈 #タグのハイライト表示
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

  const exchangeLogs = useMemo(() => entry.log.filter((l) => getPhase(l) === "exchange"), [entry.log]);
  const finalLogs = useMemo(() => entry.log.filter((l) => getPhase(l) === "final"), [entry.log]);
  const judgeLogs = useMemo(() => entry.log.filter((l) => getPhase(l) === "judge"), [entry.log]);

  const renderBubble = (line, idx) => {
    const speaker = getSpeaker(line);
    const clean = line.replace(/^🧠 AI-1（最終意見）：|^🧠 |^⚖️ AI-2（最終意見）：|^⚖️ |^🧩 /, "");

    const baseClasses = "max-w-[90%] p-5 rounded-xl shadow-md mb-4 whitespace-pre-wrap break-words";
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
        onClick={() => navigate(-1)}
        className="fixed bottom-4 left-1/2 transform -translate-x-1/2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 rounded text-white font-semibold z-50"
      >
        ← 戻る
      </button>

      <div className="max-w-3xl mx-auto space-y-8">
        <section>
          <h2 className="text-3xl font-bold text-indigo-300 mb-3">議題</h2>
          <div className="bg-gray-800 p-6 rounded-lg text-lg border border-gray-700 whitespace-pre-wrap">
            {entry.topic}
          </div>
        </section>

        {entry.tags?.length > 0 && (
          <section>
            <h2 className="text-xl font-semibold text-indigo-300 mb-2">タグ</h2>
            <div className="flex flex-wrap gap-2">
              {entry.tags.map((tag, idx) => (
                <span
                  key={idx}
                  className="inline-block bg-indigo-700 text-white px-2 py-0.5 rounded-full text-sm font-medium"
                >
                  {tag}
                </span>
              ))}
            </div>
          </section>
        )}

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

        <section>
          <h2 className="text-2xl font-semibold text-indigo-200 mb-4">コメント・メモ</h2>
          <textarea
            rows={4}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="ここにメモを入力（#タグ も記述可能）"
            className="w-full p-4 rounded-lg bg-gray-800 border border-gray-700 text-white"
          />
        </section>

        <div className="text-sm text-gray-400 text-right">
          保存日時：{new Date(entry.timestamp).toLocaleString()}
        </div>
      </div>
    </div>
  );
}
