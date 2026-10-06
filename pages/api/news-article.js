// pages/api/news-article.js
// 이슈 키워드에서 고른 기사 1개의 본문 앞부분 (글쓰기 근거용, AI 없음)
// 네이버 뉴스 기사는 집 PC 프록시로, 그 외 주소는 제목만 쓴다.
import { requireAuth } from "../../lib/auth";

export const config = { maxDuration: 20 };

export default async function handler(req, res) {
  if (!requireAuth(req, res)) return;
  const url = String(req.query.url || "");
  if (!/^https:\/\/(n\.)?news\.naver\.com\//.test(url)) return res.status(200).json({ error: "네이버 뉴스 기사만 본문을 가져올 수 있어요", body: "" });
  const proxyUrl = process.env.HOME_PROXY_URL, proxyKey = process.env.HOME_PROXY_KEY;
  if (!proxyUrl || !proxyKey) return res.status(200).json({ error: "프록시 미설정", body: "" });
  try {
    const r = await fetch(`${proxyUrl}/naver-news-article?url=${encodeURIComponent(url)}&key=${encodeURIComponent(proxyKey)}`);
    if (r.status === 404) return res.status(200).json({ error: "집 PC 프록시에 기사 읽기 기능 없음 (server.js 업데이트 필요)", body: "" });
    const j = await r.json().catch(() => null);
    if (!r.ok || !j) return res.status(200).json({ error: j?.error || ("프록시 응답 " + r.status), body: "" });
    res.status(200).json(j);
  } catch (e) { res.status(200).json({ error: e.message, body: "" }); }
}
