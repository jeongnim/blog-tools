// pages/api/claude.js
export const config = { maxDuration: 60 };

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "POST만 허용" });

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return res.status(500).json({
    error: "API 키 없음",
    message: "ANTHROPIC_API_KEY 환경변수가 설정되지 않았습니다.",
  });

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify(req.body),
    });

    if (!response.ok) {
      const errText = await response.text();
      return res.status(response.status).json({
        error: "Anthropic API 오류",
        message: `HTTP ${response.status}: ${errText.slice(0, 200)}`,
      });
    }

    const data = await response.json();

    // Anthropic API 자체 에러 (타입 오류, 과금 한도 등)
    if (data.type === "error") {
      return res.status(400).json({
        error: data.error?.type || "api_error",
        message: data.error?.message || "AI 생성 실패",
      });
    }

    res.status(200).json(data);
  } catch (err) {
    res.status(500).json({
      error: "AI 생성 실패",
      message: err.message,
    });
  }
}
