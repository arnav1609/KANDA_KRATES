import "dotenv/config";
import express from "express";
import cors from "cors";
import chatRoute from "./routes/chat.js";

const app = express();

/* ✅ Proper CORS for phone + web */
app.use(cors({
  origin: "*",
  methods: ["GET", "POST"],
  allowedHeaders: ["Content-Type"]
}));

app.use(express.json());

/* ✅ Chat route */
app.use("/api/chat", chatRoute);

/* ✅ Bind to LAN so phone can connect */
app.listen(5000, "0.0.0.0", () => {
  console.log("🚜 Kanda Krates AI Backend running on port 5000");
  console.log("🤖 Groq key loaded:", !!process.env.GROQ_API_KEY);
});
