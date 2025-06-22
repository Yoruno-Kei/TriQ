import { doc, getDoc } from "firebase/firestore";
import { db } from "./firebase"; 

export async function getLogFromFirestore(id) {
  if (!id) return null;
  const docRef = doc(db, "triqLogs", id);
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    return docSnap.data();
  }
  return null;
}
