import { doc, getDoc, collection, setDoc, addDoc, deleteDoc } from "firebase/firestore";
import { db } from "./firebase"; 

// ログをFirestoreの triqLogs コレクションに保存する関数
export async function saveLogToFirestore(logData, existingId) {
  if (existingId) {
    const docRef = doc(db, "triqLogs", existingId);
    await setDoc(docRef, logData, { merge: true });
    return existingId;
  } else {
    const docRef = await addDoc(collection(db, "triqLogs"), logData);
    return docRef.id;
  }
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

export async function deleteLogFromFirestore(id) {
  if (!id) return;
  const docRef = doc(db, "triqLogs", id);
  await deleteDoc(docRef);
}