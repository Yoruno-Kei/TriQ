import React from "react";
import { Trash2, X } from "lucide-react";

export default function Sidebar({
  sidebarOpen,
  closeSidebar,
  savedLogs,
  filteredLogs,
  searchKeyword,
  setSearchKeyword,
  filter,
  setFilter,
  deleteLog,
  navigate,
  selectedTag,
  setSelectedTag,
}) {
  // 詳細画面で登録されたタグ一覧
  const tagList = Array.from(
    new Set(savedLogs.flatMap((log) => log.tags || []))
  );

  return (
    <aside
      className={`fixed top-0 right-0 bottom-0 z-50 bg-gray-950 text-white shadow-2xl transition-transform duration-300 ease-in-out ${
        sidebarOpen ? "translate-x-0" : "translate-x-full"
      }`}
      style={{ width: "80vw", maxWidth: "320px", minWidth: "260px" }}
      onClick={(e) => e.stopPropagation()}
    >
      {/* ヘッダー */}
      <div className="p-4 border-b border-gray-800 sticky top-0 bg-gray-950 z-10">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-indigo-300">ログ</h2>
          <button onClick={closeSidebar}>
            <X className="w-6 h-6 text-gray-400 hover:text-white" />
          </button>
        </div>
        {/* 課題検索 */}
        <input
          type="text"
          placeholder="議題検索..."
          value={searchKeyword}
          onChange={(e) => setSearchKeyword(e.target.value)}
          className="w-full p-2 mt-3 rounded bg-gray-800 text-white placeholder-gray-400 border border-indigo-600"
        />
        {/* フィルター */}
        <div className="flex flex-wrap gap-2 mt-3">
          {["all", "pro", "con", "undecided"].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1 rounded text-sm font-semibold border transition ${
                filter === f
                  ? "bg-indigo-600 text-white"
                  : "bg-gray-800 text-gray-300 border-indigo-600"
              }`}
            >
              {f === "all"
                ? "全て"
                : f === "pro"
                ? "賛成"
                : f === "con"
                ? "反対"
                : "判定不能"}
            </button>
          ))}
        </div>

        {/* タグ選択 */}
        {tagList.length > 0 && (
  <div className="mt-4">
    <h3 className="text-sm text-indigo-400 mb-1">タグで絞り込み</h3>
    <div className="flex flex-wrap gap-2">
      {tagList.map((tag, i) => {
        const isSelected = selectedTag === tag;
        return (
          <button
            key={i}
            onClick={() => setSelectedTag(isSelected ? "" : tag)}
            className={`px-2 py-1 border text-xs rounded transition-all duration-150 ${
              isSelected
                ? "bg-indigo-600 text-white border-indigo-300 scale-105 shadow-sm"
                : "bg-gray-800 text-indigo-300 border-indigo-500 hover:bg-indigo-600 hover:text-white"
            }`}
          >
            #{tag}
          </button>
        );
      })}
    </div>
  </div>
)}


        <button
          onClick={() => {
            if (window.confirm("本当にすべてのログを削除しますか？")) {
              localStorage.removeItem("triqLogs");
              window.location.reload();
            }
          }}
          className="w-full p-2 mt-4 bg-red-600 rounded hover:bg-red-700 transition"
        >
          全削除
        </button>
      </div>

      {/* ログ一覧 */}
      <div className="overflow-y-auto h-[calc(100%-240px)] px-4 py-3">
        {filteredLogs.length === 0 ? (
          <p className="text-gray-500 text-center mt-10">ログがありません</p>
        ) : (
          filteredLogs.map((entry) => (
            <div
              key={entry.id}
              className="relative p-4 mb-4 rounded bg-gray-800 hover:bg-gray-700 cursor-pointer border border-indigo-700"
              onClick={() => {
                navigate(`/log/${entry.id}`);
                closeSidebar();
              }}
            >
              <div className="text-xs text-gray-400">
                {new Date(entry.timestamp).toLocaleString()}
              </div>
              <div className="font-semibold">{entry.topic}</div>
              <div className="text-sm text-indigo-300">{entry.winner}</div>
              {entry.tags?.length > 0 && (
                <div className="text-xs text-gray-400 mt-1 italic truncate">
                  #{entry.tags.join(" #")}
                </div>
              )}
              <button
                onClick={(e) => {
                  console.log("Navigating to", `/log/${entry.id}`);
                  e.stopPropagation();
                  deleteLog(entry.id);
                }}
                className="absolute top-2 right-2"
              >
                <Trash2 className="w-5 h-5 text-red-500 hover:text-red-700" />
              </button>
            </div>
          ))
        )}
      </div>
    </aside>
  );
}
