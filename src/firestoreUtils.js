import { doc, getDoc, collection, setDoc, addDoc } from "firebase/firestore";
import { db } from "./firebase"; 

// ログをサーバーに保存する関数
export async function saveLogToServer(logData, existingId = null) {
  const res = await fetch("/api/logs/save", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ logData, existingId }),
  });
  if (!res.ok) throw new Error("ログ保存に失敗");
  const data = await res.json();
  return data.id;
}

export async function getLogFromServer(id) {
  const res = await fetch(`/api/logs/${id}`);
  if (!res.ok) throw new Error("ログ取得に失敗");
  return await res.json();
}
