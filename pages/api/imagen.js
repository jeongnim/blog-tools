// pages/api/imagen.js
// AI Horde (Stable Horde) 이미지 생성 (완전 무료, 분산 GPU 네트워크)
export const config = { maxDuration: 60 };

const HORDE_API = "https://stablehorde.net/api/v2";
const ANON_KEY = "0000000000";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "POST만 허용" });

  const { prompt } = req.body;
  if (!prompt) return res.status(400).json({ error: "prompt 필요" });

  try {
    // 1. 생성 요청
    const submitRes = await fetch(`${HORDE_API}/generate/async`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "apikey": ANON_KEY,
        "Client-Agent": "blog-tools:1.0:anonymous",
      },
      body: JSON.stringify({
        prompt,
        params: {
          width: 1024,
          height: 768,
          steps: 20,
          n: 1,
          sampler_name: "k_euler",
          cfg_scale: 7,
        },
        models: ["stable_diffusion"],
        r2: true,
      }),
      signal: AbortSignal.timeout(15000),
    });

    if (!submitRes.ok) {
      const err = await submitRes.text();
      return res.status(500).json({ error: `요청 실패: ${submitRes.status} ${err}` });
    }

    const { id } = await submitRes.json();
    if (!id) return res.status(500).json({ error: "생성 ID를 받지 못했습니다." });

    // 2. 완료될 때까지 폴링 (최대 55초)
    const maxWait = 55000;
    const interval = 3000;
    const start = Date.now();

    while (Date.now() - start < maxWait) {
      await new Promise(r => setTimeout(r, interval));

      const checkRes = await fetch(`${HORDE_API}/generate/check/${id}`, {
        headers: { "Client-Agent": "blog-tools:1.0:anonymous" },
        signal: AbortSignal.timeout(8000),
      });
      const check = await checkRes.json();

      if (check.done) {
        const statusRes = await fetch(`${HORDE_API}/generate/status/${id}`, {
          headers: { "Client-Agent": "blog-tools:1.0:anonymous" },
          signal: AbortSignal.timeout(10000),
        });
        const status = await statusRes.json();
        const generation = status.generations?.[0];
        if (!generation) return res.status(500).json({ error: "생성 결과 없음" });

        const imgRes = await fetch(generation.img, { signal: AbortSignal.timeout(15000) });
        if (!imgRes.ok) return res.status(500).json({ error: "이미지 다운로드 실패" });

        const arrayBuffer = await imgRes.arrayBuffer();
        const base64 = Buffer.from(arrayBuffer).toString("base64");
        const mimeType = imgRes.headers.get("content-type") || "image/webp";

        return res.status(200).json({ base64, mimeType });
      }

      if (check.faulted) {
        return res.status(500).json({ error: "이미지 생성 중 오류가 발생했습니다." });
      }
    }

    return res.status(500).json({ error: "생성 시간 초과 (55초)" });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
