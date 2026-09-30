// pages/api/cafe-rank.js
// 카페 글 하나가 키워드로 검색했을 때 몇 위에 보이는지
//  - 통합검색·카페탭: 집 PC 프록시가 실제 검색 화면을 읽음
//  주소 형태: cafe.naver.com/{카페}/{글번호}, .../f-e/cafes/{id}/articles/{글번호}, m.cafe.../ca-fe/web/cafes/..., ArticleRead.nhn?clubid=&articleid=
//  - API: 네이버 카페글 검색 API(정확도순 100위까지) — 프록시가 안 될 때 참고용
import { requireAuth } from "../../lib/auth";

export const config = { maxDuration: 25 };

// 카페 글 주소 → { cafe, articleId }
export function parseCafeLink(url) {
  const u = String(url || "");
  let m = u.match(/cafe\.naver\.com\/(?:ca-fe\/web|f-e)\/cafes\/([^/?#&]+)\/articles\/(\d+)/i);
  if (m) return { cafe: m[1].toLowerCase(), articleId: m[2] };
  m = u.match(/clubid=(\d+)[^#]*?articleid=(\d+)/i) || u.match(/articleid=(\d+)[^#]*?clubid=(\d+)/i);
  if (m) return /clubid=\d+[^#]*?articleid/i.test(u) ? { cafe: m[1], articleId: m[2] } : { cafe: m[2], articleId: m[1] };
  m = u.match(/cafe\.naver\.com\/([A-Za-z0-9_\-]+)\/(\d+)/i);
  if (m) return { cafe: m[1].toLowerCase(), articleId: m[2] };
  return null;
}
const same = (a, cafe, articleId) => a && String(a.articleId) === String(articleId) &&
  (!cafe || !a.cafe || /^\d+$/.test(cafe) || /^\d+$/.test(a.cafe) || a.cafe === cafe);

async function viaProxy(keyword, cafe, articleId) {
  const proxyUrl = process.env.HOME_PROXY_URL, proxyKey = process.env.HOME_PROXY_KEY;
  if (!proxyUrl || !proxyKey) return { areas: null, error: "프록시 미설정" };
  try {
    const ctrl = new AbortController(); const t = setTimeout(() => ctrl.abort(), 15000);
    const r = await fetch(`${proxyUrl}/naver-search-cafe?keyword=${encodeURIComponent(keyword)}&cafe=${encodeURIComponent(cafe)}&articleId=${encodeURIComponent(articleId)}&key=${encodeURIComponent(proxyKey)}`, { signal: ctrl.signal });
    clearTimeout(t);
    if (r.status === 404) return { areas: null, error: "집 PC 프록시에 카페 검색 기능 없음 (server.js 업데이트 필요)" };
    if (!r.ok) return { areas: null, error: "프록시 응답 오류 " + r.status };
    const d = await r.json();
    return { areas: d.areas || null, error: null };
  } catch (e) { return { areas: null, error: "프록시 연결 실패: " + (e?.message || "") }; }
}

async function viaApi(keyword, cafe, articleId) {
  const hubId = process.env.NAVER_HUB_CLIENT_ID, hubSecret = process.env.NAVER_HUB_CLIENT_SECRET;
  const tries = [];
  if (hubId && hubSecret) tries.push({ url: `https://naverapihub.apigw.ntruss.com/search/v1/cafearticle?query=${encodeURIComponent(keyword)}&display=100&start=1&sort=sim&format=json`,
    headers: { "X-NCP-APIGW-API-KEY-ID": hubId, "X-NCP-APIGW-API-KEY": hubSecret } });
  if (process.env.NAVER_CLIENT_ID && process.env.NAVER_CLIENT_SECRET) tries.push({ url: `https://openapi.naver.com/v1/search/cafearticle.json?query=${encodeURIComponent(keyword)}&display=100&start=1&sort=sim`,
    headers: { "X-Naver-Client-Id": process.env.NAVER_CLIENT_ID, "X-Naver-Client-Secret": process.env.NAVER_CLIENT_SECRET } });
  let lastErr = "네이버 API 키 미설정";
  for (const t of tries) {
    try {
      const r = await fetch(t.url, { headers: t.headers });
      const j = await r.json().catch(() => null);
      if (!r.ok) { lastErr = j?.error?.message || j?.errorMessage || ("API 응답 " + r.status); continue; }
      const items = (j?.items || []).map(x => ({ title: String(x.title || "").replace(/<[^>]+>/g, ""), cafeName: x.cafename, ...(parseCafeLink(x.link) || {}) }));
      const i = items.findIndex(x => same(x, cafe, articleId));
      return { rank: i >= 0 ? i + 1 : null, total: j?.total ?? null, title: i >= 0 ? items[i].title : null, error: null };
    } catch (e) { lastErr = e.message; }
  }
  return { rank: null, total: null, error: lastErr };
}

export default async function handler(req, res) {
  if (!requireAuth(req, res)) return;
  const keyword = String(req.query.keyword || "").trim();
  const link = parseCafeLink(req.query.link);
  if (!keyword) return res.status(400).json({ error: "keyword 필요" });
  if (!link) return res.status(400).json({ error: "카페 글 주소를 읽지 못했어요" });

  const [p, a] = await Promise.all([viaProxy(keyword, link.cafe, link.articleId), viaApi(keyword, link.cafe, link.articleId)]);
  res.status(200).json({
    keyword, cafe: link.cafe, articleId: link.articleId,
    mainRank: p.areas?.main_search?.rank ?? null,
    cafeRank: p.areas?.cafe?.rank ?? null,
    cafeTotal: p.areas?.cafe?.total ?? null,
    apiRank: a.rank, apiTitle: a.title,
    proxyError: p.error || p.areas?.main_search?.error || p.areas?.cafe?.error || null,
    apiError: a.error,
  });
}
