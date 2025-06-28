import React, { useState, useEffect } from "react";
import {
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer,
  LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid
} from "recharts";

import { getUserStats, getTitle, getLevelDetails } from "./userStats";

function RadarStats({ stats }) {
  const data = [
    { stat: "論理力", key: "logic", value: stats.logic },
    { stat: "説得力", key: "persuasiveness", value: stats.persuasiveness },
    { stat: "表現力", key: "expression", value: stats.expression },
    { stat: "多様性", key: "diversity", value: stats.diversity },
    { stat: "洞察力", key: "depth", value: stats.depth },
  ];

  return (
    <div className="bg-gray-800 p-4 rounded shadow flex flex-col md:flex-row items-center md:items-start gap-4 h-auto">
      <div className="w-full md:w-2/3 h-64">
        <h3 className="text-sm mb-2 text-indigo-300">5ステータス分布</h3>
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart data={data}>
            <PolarGrid stroke="#444" />
            <PolarAngleAxis dataKey="stat" stroke="#aaa" />
            <PolarRadiusAxis angle={45} domain={[0, 100]} stroke="#777" />
            <Radar name="現在の値" dataKey="value" stroke="#60a5fa" fill="#60a5fa" fillOpacity={0.6} />
          </RadarChart>
        </ResponsiveContainer>
      </div>

      {/* ステータスの数値表示 */}
      <div className="w-full md:w-1/3 space-y-2 text-sm text-gray-200">
        <h4 className="text-indigo-300 text-sm">現在の数値</h4>
        <ul className="space-y-1">
          {data.map((item) => (
            <li key={item.key} className="flex justify-between border-b border-gray-700 pb-1">
              <span>{item.stat}</span>
              <span className="font-bold text-indigo-400">{item.value}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function LineChartScore({ history }) {
  const chartData = history.map((entry) => ({
    date: new Date(entry.timestamp).toLocaleDateString(),
    total: entry.total,
  }));

  return (
    <div className="h-48 bg-gray-800 p-4 rounded shadow">
      <h3 className="text-sm mb-2 text-indigo-300">総合スコアの推移</h3>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#444" />
          <XAxis dataKey="date" stroke="#aaa" />
          <YAxis domain={[0, 'auto']} stroke="#aaa" />
          <Tooltip />
          <Line type="monotone" dataKey="total" stroke="#60a5fa" strokeWidth={2} dot={{ r: 3 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

function SummaryList({ history }) {
  return (
    <div className="mt-6 bg-gray-800 p-4 rounded shadow max-h-60 overflow-y-auto">
      <h3 className="text-sm mb-2 text-indigo-300">AIの総合コメント履歴</h3>
      <ul className="space-y-2 text-sm text-gray-200">
        {history.slice().reverse().map((h, i) => (
          <li key={i} className="border-b border-gray-600 pb-2">
            <div className="text-xs text-gray-400">{new Date(h.timestamp).toLocaleString()}</div>
            <div className="mt-1 italic">“{h.summary || "（コメントなし）"}”</div>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function UserStatsPanel() {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    setStats(getUserStats());
  }, []);

  if (!stats) return null;

  const history = stats.history || [];

  const {
    level,
    exp,
    nextLevelExp,
    progressRate,
    avgScore,
    numBattles,
  } = getLevelDetails(stats); // 💡 追加

  const title = getTitle(level);

  return (
    <div className="p-4 bg-gray-900 text-white rounded-xl shadow-md max-w-2xl mx-auto space-y-6">
      <h2 className="text-xl font-bold text-indigo-300">🧠 討論スコア</h2>

      {/* 称号＆レベル */}
      <div className="text-center my-4">
        <div className="text-indigo-400 text-sm">称号</div>
        <div className="text-2xl font-bold">{title}</div>
        <div className="text-sm text-gray-400">
          レベル: {level}（Exp: {exp} / {nextLevelExp}）
        </div>
        <div className="text-xs text-gray-500">
          平均スコア: {avgScore}・討論数: {numBattles}
        </div>

        {/* 💡 進行ゲージ */}
        <div className="w-full bg-gray-700 rounded mt-2 h-3">
          <div
            className="bg-indigo-500 h-3 rounded transition-all"
            style={{ width: `${progressRate * 100}%` }}
          />
        </div>
      </div>

      {/* 五角形レーダーチャート */}
      <RadarStats stats={stats} />

      {/* 総合スコア推移の折れ線グラフ */}
      <LineChartScore history={history} />

      {/* AIの総合コメント履歴 */}
      <SummaryList history={history} />
    </div>
  );
}
