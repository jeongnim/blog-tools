export default async function handler(req, res) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return res.status(200).json({ status: "❌ ANTHROPIC_API_KEY 없음" });

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 50,
        messages: [{ role: "user", content: "안녕" }]
      }),
    });
    const data = await response.json();
    if (data.error) return res.status(200).json({ status: "❌ Claude 오류", error: data.error.message, type: data.error.type });
    const text = data.content?.[0]?.text || "";
    res.status(200).json({ status: "✅ 정상", response: text, apiKeyPrefix: apiKey.substring(0,12)+"..." });
  } catch (err) {
    res.status(200).json({ status: "❌ 네트워크 오류", error: err.message });
  }
}
