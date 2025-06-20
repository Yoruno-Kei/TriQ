// LogDetail.jsx
import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";

export default function LogDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const logs = JSON.parse(localStorage.getItem("triqLogs") || "[]");
  const entry = logs[id];

  const [comment, setComment] = useState(entry?.comment || "");
  const [tagsInput, setTagsInput] = useState(entry?.tags?.join(", ") || "");

  if (!entry) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-950 to-gray-900 text-white px-4 py-6 sm:p-6 font-sans">
        <p className="text-red-400 font-semibold mb-4 text-lg">ログが見つかりません。</p>
        <button
          onClick={() => navigate(-1)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-3 rounded w-full sm:w-auto text-lg font-semibold"
        >
          ← 戻る
        </button>
      </div>
    );
  }

  const getBubbleProps = (text) => {
    if (text.startsWith("🧠")) {
      return {
        bubbleClass: "bg-blue-100 text-gray-900 border-blue-300",
        selfClass: "self-start",
        label: "🧠 AI-1（賛成）",
      };
    }
    if (text.startsWith("⚖️")) {
      return {
        bubbleClass: "bg-red-100 text-gray-900 border-red-300",
        selfClass: "self-end",
        label: "⚖️ AI-2（反対）",
      };
    }
    if (text.startsWith("🧩")) {
      return {
        bubbleClass: "bg-green-100 text-gray-900 border-green-300",
        selfClass: "self-center",
        label: "🧩 AI-3（判定）",
      };
    }
    return {
      bubbleClass: "bg-gray-100 text-gray-900 border-gray-300",
      selfClass: "self-center",
      label: "AI",
    };
  };

  const saveComment = () => {
    logs[id].comment = comment;
    localStorage.setItem("triqLogs", JSON.stringify(logs));
    alert("コメントを保存しました！");
  };

  const saveTags = () => {
    const newTags = tagsInput.split(",").map(t => t.trim()).filter(Boolean);
    logs[id].tags = newTags;
    localStorage.setItem("triqLogs", JSON.stringify(logs));
    alert("タグを保存しました！");
  };

  const handleNativeShare = () => {
    const shareText = `TriQ討論ログ - 議題: ${entry.topic}\n結論: ${entry.winner}`;
    if (navigator.share) {
      navigator.share({
        title: "TriQ 討論ログ",
        text: shareText,
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(`${shareText}\n${window.location.href}`);
      alert("リンクがクリップボードにコピーされました！");
    }
  };

  const handleTwitterShare = () => {
    const text = `「${entry.topic}」の討論ログをチェック！\n結論👉 ${entry.winner}`;
    const url = window.location.href;
    const twitterURL = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;
    window.open(twitterURL, "_blank");
  };

  const handleFacebookShare = () => {
    const url = window.location.href;
    const facebookURL = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
    window.open(facebookURL, "_blank");
  };

  const handleLineShare = () => {
    const text = `「${entry.topic}」\n結論👉 ${entry.winner}`;
    const url = window.location.href;
    const lineURL = `https://social-plugins.line.me/lineit/share?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`;
    window.open(lineURL, "_blank");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-950 to-gray-900 text-white px-5 py-8 sm:p-8 font-sans pb-24">
      <div className="max-w-3xl mx-auto space-y-8">
        <section className="mb-10">
          <h2 className="text-3xl sm:text-4xl font-bold text-blue-300 mb-4">📝 議題</h2>
          <p className="bg-gray-800 p-6 rounded-lg shadow text-white whitespace-pre-wrap border border-gray-600 text-lg sm:text-xl">
            {entry.topic}
          </p>
        </section>

        <section className="mb-10">
          <h3 className="text-2xl sm:text-3xl font-semibold text-blue-200 mb-6">💬 討論ログ</h3>
          <div className="flex flex-col space-y-6">
            {entry.log.map((line, i) => {
              const { bubbleClass, selfClass, label } = getBubbleProps(line);
              const cleanText = line.replace(/^🧠 |^⚖️ |^🧩 /, "");
              return (
                <div
                  key={i}
                  className={`relative max-w-[95%] sm:max-w-[80%] p-6 rounded-lg shadow-md whitespace-pre-wrap border ${bubbleClass} ${selfClass}`}
                >
                  <span className="text-base font-semibold opacity-90">{label}</span>
                  <p className="mt-2 text-base sm:text-lg leading-relaxed">{cleanText}</p>
                </div>
              );
            })}
          </div>
        </section>

        <section className="mb-8">
          <h3 className="text-2xl sm:text-3xl font-semibold text-yellow-300 mb-3">🏁 結論</h3>
          <div className="bg-yellow-100 text-gray-900 p-6 rounded shadow text-lg sm:text-xl border border-yellow-300">
            {entry.winner}
          </div>
        </section>

        <section className="mb-8">
          <h3 className="text-xl font-semibold text-green-300 mb-2">📝 コメント・メモ</h3>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={6}
            placeholder="ここに自由にメモを入力してください"
            className="w-full p-3 rounded border border-gray-600 bg-gray-800 text-white resize-y text-base sm:text-lg"
            aria-label="コメント・メモ入力"
          />
          <button
            onClick={saveComment}
            className="mt-3 bg-green-600 hover:bg-green-700 text-white px-5 py-3 rounded shadow font-semibold"
            aria-label="コメント保存"
          >
            コメントを保存
          </button>
        </section>

        <section className="mb-8">
          <h3 className="text-xl font-semibold text-pink-300 mb-2">🏷️ タグ編集</h3>
          <input
            type="text"
            value={tagsInput}
            onChange={(e) => setTagsInput(e.target.value)}
            placeholder="タグをカンマ区切りで入力（例：教育,経済）"
            className="w-full p-3 rounded border border-gray-600 bg-gray-800 text-white text-base sm:text-lg"
            aria-label="タグ編集入力"
          />
          <button
            onClick={saveTags}
            className="mt-3 bg-pink-600 hover:bg-pink-700 text-white px-5 py-3 rounded shadow font-semibold"
            aria-label="タグ保存"
          >
            タグを保存
          </button>
        </section>

        <div className="text-base text-gray-400 mb-6">
          保存日時: {new Date(entry.timestamp).toLocaleString()}
        </div>

        <section className="flex flex-wrap gap-4 pb-20">
          <button
            onClick={handleNativeShare}
            className="flex-1 min-w-[140px] bg-indigo-500 hover:bg-indigo-600 text-white px-5 py-3 rounded shadow text-lg font-semibold"
          >
            🔗 一般共有
          </button>
          <button
            onClick={handleTwitterShare}
            className="flex-1 min-w-[140px] bg-blue-400 hover:bg-blue-500 text-white px-5 py-3 rounded shadow text-lg font-semibold"
          >
            🐦 X（旧Twitter）
          </button>
          <button
            onClick={handleFacebookShare}
            className="flex-1 min-w-[140px] bg-blue-700 hover:bg-blue-800 text-white px-5 py-3 rounded shadow text-lg font-semibold"
          >
            📘 Facebook
          </button>
          <button
            onClick={handleLineShare}
            className="flex-1 min-w-[140px] bg-green-500 hover:bg-green-600 text-white px-5 py-3 rounded shadow text-lg font-semibold"
          >
            💬 LINE
          </button>
        </section>
      </div>

      {/* フッター固定の戻るボタン */}
      <div className="fixed bottom-4 left-0 w-full px-6">
        <button
          onClick={() => navigate(-1)}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white px-6 py-4 rounded-full text-lg font-semibold shadow-md sm:max-w-xs mx-auto block"
        >
          ← ホームに戻る
        </button>
      </div>
    </div>
  );
}
