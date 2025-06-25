import express from "express";
import cors from "cors";
import logsRouter from "./routes/logs.js";

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use("/api/logs", logsRouter); // ← ここでルーティング

app.listen(PORT, () => {
  console.log(`🚀 Listening on port ${PORT}`);
});
