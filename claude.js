// pages/api/claude.js
// Gemini 1.5 Flash API 프록시 (무료)
export const config = { maxDuration: 60 };

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "POST만 허용" });

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(200).json({ text: "", _apiKeyMissing: true });
  }

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(req.body),
      }
    );

    const data = await response.json();

    if (data.error) {
      return res.status(200).json({ text: "", _error: data.error.message });
    }

    // Gemini 응답 → text 추출
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
    res.status(200).json({ text });

  } catch (err) {
    res.status(200).json({ text: "", _error: err.message });
  }
}
