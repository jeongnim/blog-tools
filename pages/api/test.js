export default async function handler(req, res) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return res.status(200).json({ status: "❌ GEMINI_API_KEY 없음" });

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-lite:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: "say hello in korean" }] }],
          generationConfig: { maxOutputTokens: 50 }
        }),
      }
    );
    const data = await response.json();
    if (data.error) return res.status(200).json({ status: "❌ 오류", error: data.error.message });
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
    res.status(200).json({ status: "✅ 정상", response: text });
  } catch (err) {
    res.status(200).json({ status: "❌ 네트워크 오류", error: err.message });
  }
}
