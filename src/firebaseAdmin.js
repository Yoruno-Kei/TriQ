// server/firebaseAdmin.js
import admin from "firebase-admin";
import serviceAccount from "./config/serviceAccountKey.json" assert { type: "json" };

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

export const db = admin.firestore();
