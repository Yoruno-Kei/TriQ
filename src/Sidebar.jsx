// Sidebar.jsx
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
}) {
  return (
    <aside
  className={`fixed top-0 right-0 bottom-0 z-50 bg-gray-950 text-white overflow-y-auto shadow-2xl transition-transform duration-300 ease-in-out ${
    sidebarOpen ? "translate-x-0" : "translate-x-full"
  }`}
  style={{ width: "80vw", maxWidth: "320px", minWidth: "260px" }}
  aria-label="討論ログサイドバー"
>
  <div className="p-6 space-y-4">
    <div className="flex justify-between items-center">
      <h2 className="text-2xl font-bold text-indigo-300">📚 ログ</h2>
    </div>
    <input
      type="text"
      placeholder="検索..."
      value={searchKeyword}
      onChange={(e) => setSearchKeyword(e.target.value)}
      className="w-full p-2 rounded bg-gray-800 text-white placeholder-gray-400 border border-indigo-600"
    />
    <select
      value={filter}
      onChange={(e) => setFilter(e.target.value)}
      className="w-full p-2 rounded bg-gray-800 text-white border border-indigo-600"
    >
      <option value="all">すべて</option>
      <option value="pro">賛成</option>
      <option value="con">反対</option>
      <option value="undecided">判定不能</option>
    </select>
    <button
      onClick={() => {
        if (window.confirm("本当にすべてのログを削除しますか？")) {
          localStorage.removeItem("triqLogs");
        }
      }}
      className="w-full p-2 bg-red-600 rounded hover:bg-red-700 transition"
    >
      全削除
    </button>
    {filteredLogs.length === 0 ? (
      <p className="text-gray-500 text-center mt-10">ログがありません</p>
    ) : (
      filteredLogs.map((entry) => (
        <div
          key={entry.id}
          className="relative p-4 mb-4 rounded bg-gray-800 hover:bg-gray-700 cursor-pointer border border-indigo-700"
          onClick={() => {
            navigate(`/log/${savedLogs.findIndex((l) => l.id === entry.id)}`);
            closeSidebar();
          }}
        >
          <div className="text-xs text-gray-400">{new Date(entry.timestamp).toLocaleString()}</div>
          <div className="font-semibold">{entry.topic}</div>
          <div className="text-sm text-indigo-300">{entry.winner}</div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              deleteLog(entry.id);
            }}
            className="absolute top-2 right-2"
            aria-label="ログ削除"
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
