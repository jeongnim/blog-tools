// pages/api/gpt-image.js — GPT 이미지 API (회사 사이트용). 키는 Vercel 환경변수 OPENAI_API_KEY 에만 둔다.
//   POST { action:"info" }                                              → { configured }
//   POST { action:"generate", prompt, model, size, quality }            → { image:"base64 jpeg", usage, usd }
//   POST { action:"edit", prompt, model, size, quality, images:[dataURL...], mask?:dataURL(png) }
//        images 첫 장이 수정할 원본(또는 참고 사진들), mask 의 투명한 곳만 다시 그림
import { requireAuth } from "../../lib/auth";

export const config = { api: { bodyParser: { sizeLimit: "4mb" }, responseLimit: false }, maxDuration: 300 };

// 2026-12-01 에 gpt-image-1-mini·1.5 차단(1 은 10/23 종료) → 새 모델 2.6 두 가지 + gpt-image-2
const MODELS = new Set(["gpt-image-2.6-sunburst", "gpt-image-2.6-flare", "gpt-image-2"]);
const FALLBACK = "gpt-image-2";   // 새 모델이 거절하면 이걸로 한 번 더
const QUALITY = new Set(["low", "medium", "high"]);
// 100만 토큰당 달러 (대략) — 화면에 예상 비용 표시용
const PRICE = {
  "gpt-image-2.6-sunburst": { text: 5, imgIn: 8, out: 30 },   // 토큰 단가는 gpt-image-2 와 같음
  "gpt-image-2.6-flare": { text: 5, imgIn: 8, out: 30 },
  "gpt-image-2": { text: 5, imgIn: 8, out: 30 },
};

// 세 모델 모두 자유 크기 (16의 배수, 비율 3:1 이내, 0.65MP~8.3MP)
function okSize(size) {
  if (size === "auto") return true;
  const m = /^(\d{3,4})x(\d{3,4})$/.exec(String(size || ""));
  if (!m) return false;
  const w = +m[1], h = +m[2];
  return w % 16 === 0 && h % 16 === 0 && Math.max(w, h) <= 3840 && Math.max(w, h) / Math.min(w, h) <= 3 && w * h >= 655360 && w * h <= 8294400;
}
function usd(model, u) {
  const p = PRICE[model] || PRICE["gpt-image-2"];
  if (!u) return null;
  const d = u.input_tokens_details || {};
  const img = d.image_tokens ?? 0, txt = d.text_tokens ?? Math.max(0, (u.input_tokens || 0) - img);
  return (txt * p.text + img * p.imgIn + (u.output_tokens || 0) * p.out) / 1e6;
}
function dataUrlToBlob(s) {
  const m = /^data:([^;]+);base64,(.+)$/.exec(String(s || ""));
  if (!m) throw new Error("이미지 형식 오류");
  return new Blob([Buffer.from(m[2], "base64")], { type: m[1] });
}
function openaiError(j, status) {
  const msg = j?.error?.message || `OpenAI 오류 ${status}`;
  if (/safety|moderation|content policy/i.test(msg)) return "안전 정책에 걸려서 거절됐어요 — 표현을 조금 바꿔서 다시 해보세요 (" + msg.slice(0, 120) + ")";
  if (/billing|quota|insufficient/i.test(msg)) return "OpenAI 잔액·한도 문제예요 — 결제 페이지를 확인하세요 (" + msg.slice(0, 120) + ")";
  if (/organization must be verified|verify/i.test(msg)) return "이 모델은 OpenAI 조직 인증이 필요해요 — platform.openai.com 설정에서 인증하세요";
  return msg.slice(0, 300);
}
// 모델·크기 때문에 거절된 건지 (안전 정책·잔액·키 문제는 다시 해도 같으니 제외)
function rejectedFor(j, status) {
  const msg = String(j?.error?.message || "");
  const param = String(j?.error?.param || "");
  if (![400, 403, 404].includes(status)) return "";
  if (/safety|moderation|content policy|billing|quota|insufficient|api key/i.test(msg)) return "";
  if (param === "size" || /\bsize\b/i.test(msg)) return "size";
  if (param === "model" || /model|not supported|unsupported|does not exist|not found|access/i.test(msg)) return "model";
  return "";
}

export default async function handler(req, res) {
  if (!requireAuth(req, res)) return;
  if (req.method !== "POST") return res.status(405).json({ error: "POST만 허용" });
  const key = process.env.OPENAI_API_KEY || "";
  const b = req.body || {};
  if (b.action === "info") return res.status(200).json({ configured: !!key });
  if (!key) return res.status(200).json({ error: "이 사이트에는 GPT 키가 없어요 (Vercel 환경변수 OPENAI_API_KEY)" });

  // 예전 모델(1-mini 등)로 요청이 와도 gpt-image-2 로 처리
  const model0 = MODELS.has(b.model) ? b.model : FALLBACK;
  const quality = QUALITY.has(b.quality) ? b.quality : "medium";
  const size0 = okSize(b.size) ? b.size : "auto";
  const prompt = String(b.prompt || "").trim().slice(0, 30000);
  if (!prompt) return res.status(200).json({ error: "프롬프트가 비어 있어요" });
  if (b.action !== "generate" && b.action !== "edit") return res.status(400).json({ error: "알 수 없는 action" });
  const imgs = (Array.isArray(b.images) ? b.images : []).slice(0, 8);
  if (b.action === "edit" && !imgs.length) return res.status(200).json({ error: "원본(참고) 사진이 없어요" });

  const call = async (model, size) => {
    if (b.action === "generate") {
      return fetch("https://api.openai.com/v1/images/generations", {
        method: "POST",
        headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
        body: JSON.stringify({ model, prompt, size, quality, n: 1, output_format: "jpeg", output_compression: 92 }),
      });
    }
    const fd = new FormData();
    fd.append("model", model);
    fd.append("prompt", prompt);
    fd.append("size", size);
    fd.append("quality", quality);
    fd.append("n", "1");
    fd.append("output_format", "jpeg");
    fd.append("output_compression", "92");
    imgs.forEach((d, i) => { const bl = dataUrlToBlob(d); fd.append("image[]", bl, `img${i}.${bl.type.includes("png") ? "png" : "jpg"}`); });
    if (b.mask) fd.append("mask", dataUrlToBlob(b.mask), "mask.png");
    return fetch("https://api.openai.com/v1/images/edits", { method: "POST", headers: { Authorization: `Bearer ${key}` }, body: fd });
  };

  try {
    let model = model0, size = size0, note = "";
    let r = await call(model, size);
    let j = await r.json().catch(() => ({}));
    // 거절되면 한 번만 다시: 크기 문제 → 기본 크기(auto), 모델 문제 → gpt-image-2
    if (!r.ok) {
      const why = rejectedFor(j, r.status);
      if (why === "size" && size !== "auto") { size = "auto"; note = "크기 거절 → 기본 크기로 다시"; }
      else if (why && model !== FALLBACK) { model = FALLBACK; note = `${model0} 거절 → ${FALLBACK} 로 다시`; }
      if (note) { r = await call(model, size); j = await r.json().catch(() => ({})); }
    }
    if (!r.ok) return res.status(200).json({ error: openaiError(j, r.status) + (note ? ` (${note} 했지만 실패)` : "") });
    const img = j.data?.[0]?.b64_json;
    if (!img) return res.status(200).json({ error: "이미지가 안 왔어요" });
    return res.status(200).json({ image: img, usage: j.usage || null, usd: usd(model, j.usage), size: j.size || size, model, requested: model0, note });
  } catch (e) {
    return res.status(200).json({ error: e.message || "요청 실패" });
  }
}
