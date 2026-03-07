// pages/api/imagen.js
// Gemini 2.0 Flash 이미지 생성 (Google AI Studio 키로 동작)
export const config = { maxDuration: 60 };

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "POST만 허용" });

  const apiKey = process.env.GOOGLE_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "GOOGLE_API_KEY 환경변수가 설정되지 않았습니다." });
  }

  const { prompt } = req.body;
  if (!prompt) return res.status(400).json({ error: "prompt 필요" });

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-preview-image-generation:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { responseModalities: ["IMAGE"] },
        }),
      }
    );

    const rawText = await response.text();

    if (!rawText || rawText.trim() === "") {
      return res.status(500).json({ error: "API 응답이 비어있습니다." });
    }

    let data;
    try {
      data = JSON.parse(rawText);
    } catch (parseErr) {
      return res.status(500).json({
        error: `JSON 파싱 실패: ${rawText.slice(0, 200)}`,
      });
    }

    if (!response.ok) {
      return res.status(response.status).json({
        error: data.error?.message || `API 오류 (${response.status})`,
      });
    }

    // 이미지 파트 추출
    const parts = data.candidates?.[0]?.content?.parts || [];
    const imgPart = parts.find(p => p.inlineData?.mimeType?.startsWith("image/"));
    if (!imgPart) {
      return res.status(500).json({ error: "이미지 생성 결과 없음 (안전 필터 또는 응답 형식 오류)" });
    }

    res.status(200).json({
      base64: imgPart.inlineData.data,
      mimeType: imgPart.inlineData.mimeType || "image/png",
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
