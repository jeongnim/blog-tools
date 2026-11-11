// pages/api/hot-keywords.js
// 🔥 지금 뜨는 검색어
//  GET  → 구글 트렌드 한국 급상승 검색어 (공개 RSS)
//  POST { keywords:[...] } → 네이버 검색어 트렌드(데이터랩)로 키워드별 상승률 계산
//        최근 14일 평균 ÷ 그 전 28일 평균  (1.5 = 50% 상승)
// 데이터랩 키는 google-keyword.js와 같은 환경변수를 쓴다 (HUB 우선, 없으면 개발자센터)
import { requireAuth } from "../../lib/auth";

export const config = { maxDuration: 30 };

const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";
const TTL = 60 * 60 * 1000;           // 같은 키워드는 1시간 동안 다시 묻지 않는다 (데이터랩 하루 한도 아끼기)
const cache = new Map();
const getC = k => { const h = cache.get(k); return h && Date.now() - h.at < TTL ? h.data : null; };
const setC = (k, data) => cache.set(k, { at: Date.now(), data });

const strip = (s = "") => String(s).replace(/<[^>]+>/g, "").replace(/&#?\w+;/g, " ").trim();
const ymd = d => d.toISOString().slice(0, 10);

async function googleTrends() {
  const hit = getC("google"); if (hit) return hit;
  const urls = ["https://trends.google.com/trending/rss?geo=KR", "https://trends.google.co.kr/trends/trendingsearches/daily/rss?geo=KR"];
  for (const url of urls) {
    try {
      const r = await fetch(url, { headers: { "User-Agent": UA, Accept: "application/rss+xml, application/xml, */*" }, signal: AbortSignal.timeout(8000) });
      if (!r.ok) continue;
      const xml = await r.text();
      if (!xml.includes("<item")) continue;
      const list = xml.split(/<item[\s>]/i).slice(1).map(c => ({
        keyword: strip(c.match(/<title>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/title>/i)?.[1] || ""),
        traffic: strip(c.match(/<ht:approx_traffic>([\s\S]*?)<\/ht:approx_traffic>/i)?.[1] || "") || null,
        news: strip(c.match(/<ht:news_item_title>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/ht:news_item_title>/i)?.[1] || "") || null,
      })).filter(x => x.keyword.length >= 2).slice(0, 25);
      if (list.length) { setC("google", list); return list; }
    } catch (e) { /* 다음 주소 */ }
  }
  return [];
}

function datalabConf() {
  const hubId = process.env.NAVER_HUB_CLIENT_ID, hubSecret = process.env.NAVER_HUB_CLIENT_SECRET;
  const useHub = !!(hubId && hubSecret);
  const id = useHub ? hubId : process.env.NAVER_CLIENT_ID, secret = useHub ? hubSecret : process.env.NAVER_CLIENT_SECRET;
  if (!id || !secret) return null;
  return {
    url: useHub ? "https://naverapihub.apigw.ntruss.com/search-trend/v1/search" : "https://openapi.naver.com/v1/datalab/search",
    headers: useHub
      ? { "Content-Type": "application/json", "X-NCP-APIGW-API-KEY-ID": id, "X-NCP-APIGW-API-KEY": secret }
      : { "Content-Type": "application/json", "X-Naver-Client-Id": id, "X-Naver-Client-Secret": secret },
  };
}

// 데이터랩은 한 번에 키워드 그룹 5개까지
async function datalabChunk(conf, words) {
  const end = new Date(); end.setDate(end.getDate() - 1);          // 오늘은 아직 덜 쌓여서 어제까지
  const start = new Date(end); start.setDate(end.getDate() - 41);  // 42일
  const r = await fetch(conf.url, {
    method: "POST", headers: conf.headers, signal: AbortSignal.timeout(10000),
    body: JSON.stringify({ startDate: ymd(start), endDate: ymd(end), timeUnit: "date",
      keywordGroups: words.map(w => ({ groupName: w, keywords: [w] })) }),
  });
  const j = await r.json().catch(() => null);
  if (!r.ok) throw new Error(j?.errorMessage || j?.errMsg || j?.message || ("데이터랩 응답 " + r.status));
  const out = {};
  for (const g of j?.results || []) {
    const vals = (g.data || []).map(x => ({ d: x.period, v: Number(x.ratio) || 0 }));
    const recentFrom = ymd(new Date(end.getTime() - 13 * 864e5));
    const recent = vals.filter(x => x.d >= recentFrom).map(x => x.v);
    const before = vals.filter(x => x.d < recentFrom).map(x => x.v);
    const avg = a => a.length ? a.reduce((s, x) => s + x, 0) / a.length : 0;
    const ra = avg(recent), ba = avg(before);
    // 데이터가 아예 없으면 null (검색이 거의 없는 말)
    out[g.title] = vals.length === 0 ? null : {
      rise: ba > 0 ? Math.round((ra / ba) * 100) / 100 : (ra > 0 ? 9.99 : null),
      spark: vals.filter((_, i) => i % 3 === 2).map(x => Math.round(x.v)),  // 작은 그래프용 (3일 간격)
    };
  }
  return out;
}

export default async function handler(req, res) {
  if (!requireAuth(req, res)) return;

  if (req.method === "GET") {
    const google = await googleTrends();
    return res.status(200).json({ google, updatedAt: new Date().toISOString() });
  }
  if (req.method !== "POST") return res.status(405).json({ error: "GET/POST만" });

  const conf = datalabConf();
  if (!conf) return res.status(200).json({ error: "네이버 검색어 트렌드 키(NAVER_HUB_CLIENT_ID/SECRET)가 없어요", trends: {} });

  const words = [...new Set((req.body?.keywords || []).map(w => String(w || "").trim()).filter(w => w && w.length <= 30))].slice(0, 80);
  const trends = {}; const need = [];
  for (const w of words) { const h = cache.get("dl:" + w); if (h && Date.now() - h.at < TTL) trends[w] = h.data; else need.push(w); }

  let error = null;
  for (let i = 0; i < need.length; i += 5) {
    const chunk = need.slice(i, i + 5);
    try {
      const got = await datalabChunk(conf, chunk);
      for (const w of chunk) { trends[w] = got[w] ?? null; setC("dl:" + w, trends[w]); }
    } catch (e) { error = e.message; break; }
  }
  res.status(200).json({ trends, error });
}
