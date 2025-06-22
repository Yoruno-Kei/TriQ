import { useState, useEffect } from "react";
import { decompressFromEncodedURIComponent } from "lz-string";

// localStorageからログ取得、URLパラメータのdata圧縮復元対応、編集用state管理など
export function useLogDetail(id) {
  const [logsState, setLogsState] = useState([]);
  const [entryState, setEntryState] = useState(null);
  const [isShared, setIsShared] = useState(false);

  useEffect(() => {
    console.log("useLogDetail effect: id, logsState", id, logsState);
    const params = new URLSearchParams(window.location.search);
    const dataParam = params.get("data");

    if (dataParam) {
      // 共有URLモード
      setIsShared(true);
      try {
        const decompressed = decompressFromEncodedURIComponent(dataParam);
        const parsed = JSON.parse(decompressed);
        setEntryState(parsed);
      } catch (e) {
        console.error("デコードエラー:", e);
        setEntryState(null);
      }
    } else {
      // ID指定モード
      setIsShared(false);
      const allLogs = JSON.parse(localStorage.getItem("triqLogs") || "[]");
      const found = allLogs.find((log) => log.id?.trim() === id?.trim());
      setEntryState(found || null);
      setLogsState(allLogs);
    }
  }, [id, logsState]);

  const saveEntry = (newEntry) => {
    if (isShared) return; // 共有モードは編集不可

    const newLogs = logsState.map((log) =>
      log.id === newEntry.id ? newEntry : log
    );
    setEntryState(newEntry);
    setLogsState(newLogs);
    localStorage.setItem("triqLogs", JSON.stringify(newLogs));
  };

  return { entryState, isShared, saveEntry };
}
