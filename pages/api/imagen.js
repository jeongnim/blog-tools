// pages/api/imagen.js
// Google Imagen 3 를 통해 이미지 4장 생성
export const config = { maxDuration: 60 };

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "POST만 허용" });

  const apiKey = process.env.GOOGLE_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "GOOGLE_API_KEY 환경변수가 설정되지 않았습니다." });
  }

  const { prompt, sampleCount = 4 } = req.body;
  if (!prompt) return res.status(400).json({ error: "prompt 필요" });

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-001:predict?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          instances: [{ prompt }],
          parameters: {
            sampleCount,
            aspectRatio: "1:1",
            safetyFilterLevel: "BLOCK_ONLY_HIGH",
            personGeneration: "DONT_ALLOW",
          },
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({
        error: data.error?.message || `Imagen API 오류 (${response.status})`,
      });
    }

    const images = (data.predictions || []).map(p => ({
      base64: p.bytesBase64Encoded,
      mimeType: p.mimeType || "image/png",
    }));

    res.status(200).json({ images });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
