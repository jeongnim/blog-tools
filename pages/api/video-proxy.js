// pages/api/video-proxy.js
// Replicate(WAN 2.1) & PixVerse API 프록시 — 키는 화면(상단 🔑)에서 고른 이름의 키를 헤더로 받는다 (서버 기본 키 없음)
import { requireAuth } from "../../lib/auth";

export const config = { maxDuration: 60, api: { responseLimit: false } };
// PixVerse 는 요청마다 새 Ai-trace-id(UUID)를 넣어야 함 — 같은 값을 다시 쓰면 새로 만들지 않고 예전 결과를 돌려줌
const trace = () => (globalThis.crypto?.randomUUID ? globalThis.crypto.randomUUID() : `${Date.now()}-${Math.random().toString(16).slice(2)}`);

export default async function handler(req, res) {
  if (!requireAuth(req, res)) return;

  if (req.method !== "POST") return res.status(405).json({ error: "POST만 허용" });

  const { action, payload } = req.body;

  const REPLICATE_TOKEN = String(req.headers["x-replicate-key"] || "").trim();
  const PIXVERSE_KEY    = String(req.headers["x-pixverse-key"] || "").trim();

  // ── Replicate: 영상 생성 요청 ──────────────────────────────────────────
  if (action === "replicate_create") {
    if (!REPLICATE_TOKEN) return res.status(200).json({ error: "Replicate 키를 넣어주세요 — 상단 🔑" });
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
    if (!REPLICATE_TOKEN) return res.status(200).json({ error: "Replicate 키를 넣어주세요 — 상단 🔑" });
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
    if (!PIXVERSE_KEY) return res.status(200).json({ error: "PixVerse 키를 넣어주세요 — 상단 🔑" });
    const { imageBase64, mimeType } = payload;
    try {
      const binary = Buffer.from(imageBase64, "base64");
      const blob = new Blob([binary], { type: mimeType });
      const fd = new FormData();
      fd.append("image", blob, "image.jpg");
      const r = await fetch("https://app-api.pixverse.ai/openapi/v2/image/upload", {
        method: "POST", headers: { "API-KEY": PIXVERSE_KEY, "Ai-trace-id": trace() }, body: fd,
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
    if (!PIXVERSE_KEY) return res.status(200).json({ error: "PixVerse 키를 넣어주세요 — 상단 🔑" });
    const { img_id, prompt, duration } = payload;
    try {
      const r = await fetch("https://app-api.pixverse.ai/openapi/v2/video/img/generate", {
        method: "POST",
        headers: { "API-KEY": PIXVERSE_KEY, "Ai-trace-id": trace(), "Content-Type": "application/json" },
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
    if (!PIXVERSE_KEY) return res.status(200).json({ error: "PixVerse 키를 넣어주세요 — 상단 🔑" });
    const { video_id } = payload;
    try {
      const r = await fetch(`https://app-api.pixverse.ai/openapi/v2/video/result/${video_id}`, {
        headers: { "API-KEY": PIXVERSE_KEY, "Ai-trace-id": trace() },
      });
      const data = await r.json();
      return res.status(200).json({ status: data?.Resp?.status, url: data?.Resp?.url });
    } catch (e) {
      return res.status(200).json({ error: e.message });
    }
  }

  // ── 만든 영상 파일 받아오기 (브라우저가 직접 못 받을 때 — 캔버스에 그리려면 같은 사이트 주소여야 함) ──
  if (action === "media_get") {
    const { url } = payload || {};
    let host = "";
    try { host = new URL(url).hostname; } catch (e) {}
    if (!/(^|\.)(pixverse\.ai|replicate\.delivery|replicate\.com)$/.test(host)) return res.status(200).json({ error: "허용되지 않은 주소" });
    try {
      const r = await fetch(url);
      if (!r.ok) return res.status(200).json({ error: `영상 받기 실패 ${r.status}` });
      const buf = Buffer.from(await r.arrayBuffer());
      res.setHeader("Content-Type", r.headers.get("content-type") || "video/mp4");
      res.setHeader("Content-Length", buf.length);
      return res.status(200).send(buf);
    } catch (e) {
      return res.status(200).json({ error: e.message });
    }
  }

  return res.status(400).json({ error: "알 수 없는 action" });
}
