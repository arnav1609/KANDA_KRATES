import fetch from "node-fetch";

export async function askGroq(prompt) {
  if (!process.env.GROQ_API_KEY) {
    throw new Error("GROQ_API_KEY is missing");
  }

  const response = await fetch(
    "https://api.groq.com/openai/v1/chat/completions",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "llama-3.1-8b-instant",
        messages: [
          {
            role: "system",
            content:
              "You are an expert agricultural AI assistant helping farmers with onion storage, spoilage prevention, and post-harvest decisions. Give clear, practical, actionable advice.",
          },
          { role: "user", content: prompt },
        ],
        temperature: 0.4,
      }),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    console.error("Groq API error:", errorText);
    throw new Error(`Groq API failed: ${response.status}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
}
