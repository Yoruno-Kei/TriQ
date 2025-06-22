import { doc, getDoc } from "firebase/firestore";
import { db } from "./firebase"; 

// ログをFirestoreの triqLogs コレクションに保存する関数
export async function saveLogToFirestore(logData) {
  if (!logData) throw new Error("logData is required");
  const docRef = await addDoc(collection(db, "triqLogs"), logData);
  return docRef.id;
}

export async function getLogFromFirestore(id) {
  if (!id) return null;
  const docRef = doc(db, "triqLogs", id);
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    return docSnap.data();
  }
  return null;
}
