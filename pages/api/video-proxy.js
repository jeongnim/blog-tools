// pages/api/video-proxy.js
// Replicate(WAN 2.2) & PixVerse API 프록시 — 키는 Vercel 환경변수에만 저장
export const config = { maxDuration: 60 };

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "POST만 허용" });

  const { action, payload } = req.body;

  const REPLICATE_TOKEN = process.env.REPLICATE_API_TOKEN;
  const PIXVERSE_KEY    = process.env.PIXVERSE_API_KEY;

  // ── Replicate: 영상 생성 요청 ──────────────────────────────────────────
  if (action === "replicate_create") {
    if (!REPLICATE_TOKEN) return res.status(200).json({ error: "REPLICATE_API_TOKEN 환경변수 없음" });
    const { image, prompt, num_frames, fps, resolution } = payload;
    const model = resolution === "720p"
      ? "wavespeedai/wan-2.1-i2v-720p"
      : "wavespeedai/wan-2.1-i2v-480p";
    try {
      const r = await fetch("https://api.replicate.com/v1/predictions", {
        method: "POST",
        headers: { "Authorization": `Token ${REPLICATE_TOKEN}`, "Content-Type": "application/json" },
        body: JSON.stringify({ version: model, input: { image, prompt, num_frames, fps } }),
      });
      const data = await r.json();
      if (!r.ok) return res.status(200).json({ error: data.detail || "Replicate 요청 실패" });
      return res.status(200).json({ id: data.id });
    } catch (e) {
      return res.status(200).json({ error: e.message });
    }
  }

  // ── Replicate: 결과 폴링 ───────────────────────────────────────────────
  if (action === "replicate_status") {
    if (!REPLICATE_TOKEN) return res.status(200).json({ error: "REPLICATE_API_TOKEN 환경변수 없음" });
    const { id } = payload;
    try {
      const r = await fetch(`https://api.replicate.com/v1/predictions/${id}`, {
        headers: { "Authorization": `Token ${REPLICATE_TOKEN}` },
      });
      const data = await r.json();
      return res.status(200).json({ status: data.status, output: data.output, error: data.error });
    } catch (e) {
      return res.status(200).json({ error: e.message });
    }
  }

  // ── PixVerse: 이미지 업로드 ────────────────────────────────────────────
  if (action === "pixverse_upload") {
    if (!PIXVERSE_KEY) return res.status(200).json({ error: "PIXVERSE_API_KEY 환경변수 없음" });
    const { imageBase64, mimeType } = payload;
    try {
      const binary = Buffer.from(imageBase64, "base64");
      const blob = new Blob([binary], { type: mimeType });
      const fd = new FormData();
      fd.append("image", blob, "image.jpg");
      const r = await fetch("https://app-api.pixverse.ai/openapi/v2/image/upload", {
        method: "POST", headers: { "API-KEY": PIXVERSE_KEY }, body: fd,
      });
      const data = await r.json();
      if (!r.ok) return res.status(200).json({ error: "PixVerse 업로드 실패" });
      return res.status(200).json({ img_id: data?.Resp?.img_id });
    } catch (e) {
      return res.status(200).json({ error: e.message });
    }
  }

  // ── PixVerse: 영상 생성 요청 ───────────────────────────────────────────
  if (action === "pixverse_create") {
    if (!PIXVERSE_KEY) return res.status(200).json({ error: "PIXVERSE_API_KEY 환경변수 없음" });
    const { img_id, prompt, duration } = payload;
    try {
      const r = await fetch("https://app-api.pixverse.ai/openapi/v2/video/img/generate", {
        method: "POST",
        headers: { "API-KEY": PIXVERSE_KEY, "Content-Type": "application/json" },
        body: JSON.stringify({ img_id, prompt, duration, quality: "high", motion_mode: "normal", aspect_ratio: "9:16" }),
      });
      const data = await r.json();
      if (!r.ok) return res.status(200).json({ error: "PixVerse 생성 실패" });
      return res.status(200).json({ video_id: data?.Resp?.video_id });
    } catch (e) {
      return res.status(200).json({ error: e.message });
    }
  }

  // ── PixVerse: 결과 폴링 ────────────────────────────────────────────────
  if (action === "pixverse_status") {
    if (!PIXVERSE_KEY) return res.status(200).json({ error: "PIXVERSE_API_KEY 환경변수 없음" });
    const { video_id } = payload;
    try {
      const r = await fetch(`https://app-api.pixverse.ai/openapi/v2/video/result/${video_id}`, {
        headers: { "API-KEY": PIXVERSE_KEY },
      });
      const data = await r.json();
      return res.status(200).json({ status: data?.Resp?.status, url: data?.Resp?.url });
    } catch (e) {
      return res.status(200).json({ error: e.message });
    }
  }

  return res.status(400).json({ error: "알 수 없는 action" });
}
