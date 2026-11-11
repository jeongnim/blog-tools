// pages/api/gemini.js
// Gemini 중계 — 나레이션(TTS)과 영상(Veo) 만들기. 키는 화면(상단 🔑 이름)의 Gemini 키를 헤더로만 받는다 (서버 기본 키 없음)
//   action: "tts"          { model, text, voice }                         → { mime, data(base64) }
//           "video_create" { model, prompt, image:{mime,data}, lastFrame?, refs?[], seconds, aspect, resolution } → { name }
//           "video_status" { name }                                      → { done, uri, error }
//           "video_get"    { uri }                                       → 영상 파일 그대로 (브라우저가 직접 못 받을 때만)
import { requireAuth } from "../../lib/auth";

export const config = { maxDuration: 60, api: { bodyParser: { sizeLimit: "4mb" }, responseLimit: false } };

const BASE = "https://generativelanguage.googleapis.com/v1beta";

// 구글 오류를 알아보기 쉬운 말로
function explain(status, body) {
  const m = String(body?.error?.message || body?.message || "").slice(0, 300);
  if (status === 401 || /API key not valid|API_KEY_INVALID|PERMISSION_DENIED.*key/i.test(m)) return "Gemini 키가 맞지 않아요 — 상단 🔑 의 Gemini 키를 확인해 주세요";
  if (/billing|paid tier|FAILED_PRECONDITION|limit: ?0|not available in the free tier/i.test(m) || (status === 429 && /limit: ?0/.test(m)))
    return "Gemini 결제(유료 등급) 연결이 필요해요 — Google AI Studio에서 이 키의 프로젝트에 결제를 연결한 뒤 다시 해주세요";
  if (status === 429) return "Gemini 사용 한도에 걸렸어요 — 1~2분 뒤 다시 해주세요";
  if (status === 404 || /not found|is not supported/i.test(m)) return `모델 이름을 확인해 주세요 (${m})`;
  return `Gemini 오류 ${status}: ${m}`;
}

export default async function handler(req, res) {
  if (!requireAuth(req, res)) return;
  if (req.method !== "POST") return res.status(405).json({ error: "POST만 허용" });
  const KEY = String(req.headers["x-gemini-key"] || "").trim();
  if (!KEY) return res.status(200).json({ error: "Gemini 키를 넣어주세요 — 상단 🔑" });
  const { action, payload = {} } = req.body || {};
  const H = { "x-goog-api-key": KEY, "Content-Type": "application/json" };

  try {
    // ── 나레이션 ──────────────────────────────────────────────
    if (action === "tts") {
      const { model, text, voice } = payload;
      if (!text) return res.status(200).json({ error: "읽을 문장이 없어요" });
      const r = await fetch(`${BASE}/models/${encodeURIComponent(model)}:generateContent`, {
        method: "POST", headers: H,
        body: JSON.stringify({
          contents: [{ parts: [{ text }] }],
          generationConfig: { responseModalities: ["AUDIO"],
            speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: voice || "Kore" } } } },
        }),
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) return res.status(200).json({ error: explain(r.status, j), status: r.status });
      const part = (j?.candidates?.[0]?.content?.parts || []).find(p => p.inlineData);
      if (!part) return res.status(200).json({ error: "음성이 오지 않았어요 (문장을 짧게 나눠 다시 해보세요)" });
      return res.status(200).json({ mime: part.inlineData.mimeType, data: part.inlineData.data });
    }

    // ── 영상: 만들기 요청 (이미지 → 영상) ─────────────────────────
    if (action === "video_create") {
      const { model, prompt, image, lastFrame, refs, seconds, aspect, resolution } = payload;
      const inst = { prompt: prompt || "subtle natural motion, slow cinematic camera move" };
      if (image?.data) inst.image = { mimeType: image.mime || "image/jpeg", bytesBase64Encoded: image.data };
      // 끝 이미지: 시작 → 끝으로 이어지는 영상
      if (lastFrame?.data) inst.lastFrame = { mimeType: lastFrame.mime || "image/jpeg", bytesBase64Encoded: lastFrame.data };
      // 참조 이미지(캐릭터·제품) 최대 3장 — 장면마다 같은 모습 유지
      if (Array.isArray(refs) && refs.length)
        inst.referenceImages = refs.slice(0, 3).filter(r => r?.data).map(r => ({
          image: { mimeType: r.mime || "image/jpeg", bytesBase64Encoded: r.data }, referenceType: "asset" }));
      const parameters = { aspectRatio: aspect || "9:16", sampleCount: 1 };
      if (seconds) parameters.durationSeconds = Number(seconds);
      if (resolution) parameters.resolution = resolution;
      const r = await fetch(`${BASE}/models/${encodeURIComponent(model)}:predictLongRunning`, {
        method: "POST", headers: H, body: JSON.stringify({ instances: [inst], parameters }),
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) return res.status(200).json({ error: explain(r.status, j), status: r.status });
      if (!j.name) return res.status(200).json({ error: "작업 번호를 못 받았어요" });
      return res.status(200).json({ name: j.name });
    }

    // ── 영상: 진행 확인 ────────────────────────────────────────
    if (action === "video_status") {
      const { name } = payload;
      if (!/^models\/[\w.\-]+\/operations\/[\w\-]+$/.test(String(name || ""))) return res.status(200).json({ error: "작업 번호가 이상해요" });
      const r = await fetch(`${BASE}/${name}`, { headers: H });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) return res.status(200).json({ error: explain(r.status, j), status: r.status });
      if (!j.done) return res.status(200).json({ done: false });
      if (j.error) return res.status(200).json({ done: true, error: explain(400, j) });
      const g = j.response?.generateVideoResponse || {};
      const uri = g.generatedSamples?.[0]?.video?.uri;
      if (!uri) return res.status(200).json({ done: true,
        error: g.raiMediaFilteredCount ? `구글 안전 기준에 걸려 영상이 만들어지지 않았어요 (${(g.raiMediaFilteredReasons || []).join(" ").slice(0, 200)}) — 프롬프트를 바꿔 다시 해주세요` : "영상 주소가 없어요" });
      return res.status(200).json({ done: true, uri });
    }

    // ── 영상: 파일 받기 (브라우저가 직접 못 받을 때) ─────────────────
    if (action === "video_get") {
      const { uri } = payload;
      if (!/^https:\/\/generativelanguage\.googleapis\.com\//.test(String(uri || ""))) return res.status(200).json({ error: "주소가 이상해요" });
      const r = await fetch(uri, { headers: { "x-goog-api-key": KEY }, redirect: "follow" });
      if (!r.ok) return res.status(200).json({ error: `영상 받기 실패 ${r.status}` });
      const buf = Buffer.from(await r.arrayBuffer());
      res.setHeader("Content-Type", r.headers.get("content-type") || "video/mp4");
      res.setHeader("Content-Length", buf.length);
      return res.status(200).send(buf);
    }

    return res.status(400).json({ error: "알 수 없는 action" });
  } catch (e) {
    return res.status(200).json({ error: String(e.message || e) });
  }
}
