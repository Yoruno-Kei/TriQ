import admin from "firebase-admin";
import fs from "fs";

const keyPath =
  process.env.NODE_ENV === "production"
    ? "/etc/secrets/serviceAccountKey.json"
    : "./serviceAccountKey.json";

const serviceAccount = JSON.parse(fs.readFileSync(keyPath, "utf8"));

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

export const db = admin.firestore();
