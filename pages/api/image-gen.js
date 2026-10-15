// pages/api/image-gen.js
// 이미지 생성: 집 PC 프록시(/image/*) → 집 PC ComfyUI(FLUX.1 schnell). 개인용 키(관리자)일 때만 동작한다.
// GET ?a=health · POST ?a=generate {prompt,width,height,steps,count,seed} · GET ?a=job&id= · GET ?a=file&filename=&subfolder=
import { requireAuth } from "../../lib/auth";

export const config = { maxDuration: 30 };

export default async function handler(req, res) {
  if (!requireAuth(req, res)) return;
  const proxyUrl = process.env.HOME_PROXY_URL, proxyKey = process.env.HOME_PROXY_KEY;
  if (!proxyUrl || !proxyKey) return res.status(200).json({ error: "집 PC 프록시 미설정", home: false });
  const k = `key=${encodeURIComponent(proxyKey)}`;
  const a = String(req.query.a || "health");
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 25000);
  try {
    let r;
    if (a === "generate" && req.method === "POST") {
      r = await fetch(`${proxyUrl}/image/generate?${k}`, {
        method: "POST", headers: { "Content-Type": "application/json" }, signal: ctrl.signal,
        body: JSON.stringify(req.body || {}),
      });
    } else if (a === "job") {
      r = await fetch(`${proxyUrl}/image/job?id=${encodeURIComponent(req.query.id || "")}&${k}`, { signal: ctrl.signal });
    } else if (a === "file") {
      r = await fetch(`${proxyUrl}/image/file?filename=${encodeURIComponent(req.query.filename || "")}&subfolder=${encodeURIComponent(req.query.subfolder || "")}&${k}`, { signal: ctrl.signal });
      if (!r.ok) return res.status(r.status).json({ error: "이미지 못 가져옴 " + r.status });
      res.setHeader("Content-Type", r.headers.get("content-type") || "image/png");
      res.setHeader("Cache-Control", "private, max-age=3600");
      return res.status(200).send(Buffer.from(await r.arrayBuffer()));
    } else {
      r = await fetch(`${proxyUrl}/image/health?${k}`, { signal: ctrl.signal });
    }
    if (r.status === 404) return res.status(200).json({ home: true, error: "집 PC server.js 업데이트 필요 (이미지 기능 없음)" });
    if (r.status === 403) return res.status(200).json({ home: true, error: "이 사이트 키로는 이미지 생성 불가 (개인용 키만)" });
    const j = await r.json().catch(() => ({ error: "프록시 응답 " + r.status }));
    return res.status(200).json({ home: true, ...j });
  } catch (e) {
    return res.status(200).json({ home: false, error: "집 PC 꺼짐 또는 연결 안 됨" });
  } finally { clearTimeout(timer); }
}
