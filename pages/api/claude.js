// pages/api/claude.js
// Gemini 1.5 Flash → Claude 호환 응답 포맷으로 변환
export const config = { maxDuration: 60 };

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "POST만 허용" });

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(200).json({ content: [] });
  }

  try {
    const { messages, system, max_tokens } = req.body;

    const contents = messages.map(m => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: typeof m.content === "string"
        ? [{ text: m.content }]
        : m.content.map(c => {
            if (c.type === "text") return { text: c.text };
            if (c.type === "image" && c.source?.data)
              return { inlineData: { mimeType: c.source.media_type || "image/jpeg", data: c.source.data } };
            return { text: "" };
          })
    }));

    const body = {
      contents,
      ...(system && { systemInstruction: { parts: [{ text: system }] } }),
      generationConfig: {
        maxOutputTokens: max_tokens || 2000,
        temperature: 0.7,
      },
    };

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      }
    );

    const data = await response.json();

    if (data.error) {
      return res.status(200).json({ content: [] });
    }

    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
    res.status(200).json({ content: [{ type: "text", text }] });

  } catch (err) {
    res.status(200).json({ content: [] });
  }
}
