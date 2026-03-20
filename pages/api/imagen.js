// pages/api/imagen.js
// Pollinations AI 이미지 생성 (무료, API 키 불필요)
export const config = { maxDuration: 60 };

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "POST만 허용" });

  const { prompt } = req.body;
  if (!prompt) return res.status(400).json({ error: "prompt 필요" });

  try {
    const seed = Math.floor(Math.random() * 99999);
    const encodedPrompt = encodeURIComponent(prompt);
    const url = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=1024&height=768&seed=${seed}&model=flux&nologo=true`;

    const response = await fetch(url, {
      signal: AbortSignal.timeout(55000),
    });

    if (!response.ok) {
      return res.status(500).json({ error: `이미지 생성 실패 (${response.status})` });
    }

    const arrayBuffer = await response.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString("base64");
    const mimeType = response.headers.get("content-type") || "image/jpeg";

    res.status(200).json({ base64, mimeType });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
