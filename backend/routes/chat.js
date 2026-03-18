import express from "express";
import { buildContext } from "../agents/contextBuilder.js";
import { buildFarmerPrompt } from "../prompts/farmerPrompt.js";
import { askGroq } from "../groq/groqClient.js";

const router = express.Router();

router.post("/", async (req, res) => {
  try {
    console.log("📥 Incoming request:", req.body);

    const { question, language = "en" } = req.body;
    if (!question) {
      return res.status(400).json({ error: "Question is required" });
    }

    const context = buildContext(question);   // ← pass question so extractBatch works
    console.log("📊 Context built:", context ? "with batch data" : "general question");

    const prompt = buildFarmerPrompt(question, context, language);
    console.log("🧠 Prompt ready");

    const answer = await askGroq(prompt);
    console.log("🤖 Groq responded");

    res.json({ answer });
  } catch (err) {
    console.error("🔥 CHATBOT ERROR:", err);
    res.status(500).json({
      error: "AI assistant failed",
      details: err.message
    });
  }
});

export default router;
