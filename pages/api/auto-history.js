// pages/api/auto-history.js
// 블로그 자동화: 우리 블로그들이 이미 메인으로 쓴 키워드 기록 (집 PC 프록시의 auto-history.json에 보관)
// GET  → { items:[{blogId, mainKeyword, title, category, at}] }   POST { items:[...] } → 추가
import { requireAuth } from "../../lib/auth";

export const config = { maxDuration: 15 };

export default async function handler(req, res) {
  if (!requireAuth(req, res)) return;
  const proxyUrl = process.env.HOME_PROXY_URL, proxyKey = process.env.HOME_PROXY_KEY;
  if (!proxyUrl || !proxyKey) return res.status(200).json({ error: "프록시 미설정", items: [] });
  try {
    if (req.method === "POST") {
      const r = await fetch(`${proxyUrl}/auto-history?key=${encodeURIComponent(proxyKey)}`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: Array.isArray(req.body?.items) ? req.body.items.slice(0, 50) : [] }),
      });
      if (r.status === 404) return res.status(200).json({ error: "집 PC 프록시에 기록 기능 없음 (server.js 업데이트 필요)" });
      return res.status(200).json(await r.json().catch(() => ({ error: "프록시 응답 " + r.status })));
    }
    const days = Math.min(Math.max(parseInt(req.query.days || "180", 10) || 180, 1), 730);
    const r = await fetch(`${proxyUrl}/auto-history?days=${days}&key=${encodeURIComponent(proxyKey)}`);
    if (r.status === 404) return res.status(200).json({ error: "집 PC 프록시에 기록 기능 없음 (server.js 업데이트 필요)", items: [] });
    const j = await r.json().catch(() => null);
    res.status(200).json(j || { error: "프록시 응답 " + r.status, items: [] });
  } catch (e) { res.status(200).json({ error: e.message, items: [] }); }
}
