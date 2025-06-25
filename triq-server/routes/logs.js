// /logs.js
import express from "express";
import { db } from "../firebaseAdmin.js"; // Admin SDK初期化済み

const router = express.Router();

router.post("/save", async (req, res) => {
  const { logData, existingId } = req.body;
  try {
    if (existingId) {
      await db.collection("triqLogs").doc(existingId).set(logData, { merge: true });
      return res.json({ id: existingId });
    } else {
      const docRef = await db.collection("triqLogs").add(logData);
      return res.json({ id: docRef.id });
    }
  } catch (error) {
    console.error("ログ保存失敗:", error);
    return res.status(500).json({ error: "保存に失敗しました" });
  }
});

router.get("/:id", async (req, res) => {
  const id = req.params.id;
  try {
    const docRef = db.collection("triqLogs").doc(id);
    const docSnap = await docRef.get();
    if (!docSnap.exists) {
      return res.status(404).json({ error: "データが見つかりません" });
    }
    return res.json(docSnap.data());
  } catch (error) {
    console.error("ログ取得失敗:", error);
    return res.status(500).json({ error: "取得に失敗しました" });
  }
});

export default router;
