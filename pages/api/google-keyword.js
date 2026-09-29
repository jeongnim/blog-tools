// pages/api/google-keyword.js
// 키워드 글쓰기의 "구글" 칸 데이터 (AI 비용 없음)
//  - suggest : 구글 자동완성 연관검색어 (Vercel에서 직접)
//  - naver   : 네이버 데이터랩 검색어 트렌드 12개월 주 단위 (공식 API, 네이버 개발자 앱에 "데이터랩(검색어트렌드)" 추가 필요)
//  - google  : 구글 트렌드 12개월 주 단위 + 관련 검색어 (집 PC 프록시 경유 — 클라우드 IP는 자주 막힘)
import { requireAuth } from "../../lib/auth";

export const config = { maxDuration: 30 };

async function withTimeout(p, ms) {
  let t; const timer = new Promise((_, rej) => { t = setTimeout(() => rej(new Error("시간 초과")), ms); });
  try { return await Promise.race([p, timer]); } finally { clearTimeout(t); }
}

// ── 구글 자동완성 ──
async function googleSuggest(q) {
  const one = async (query) => {
    const url = `https://suggestqueries.google.com/complete/search?client=firefox&hl=ko&gl=kr&ie=utf-8&oe=utf-8&q=${encodeURIComponent(query)}`;
    const r = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0", "Accept-Language": "ko-KR,ko;q=0.9" } });
    if (!r.ok) throw new Error("자동완성 응답 " + r.status);
    const buf = Buffer.from(await r.arrayBuffer());
    let text = buf.toString("utf8");
    if (text.includes("\uFFFD")) { try { text = new TextDecoder("euc-kr").decode(buf); } catch (e) {} }
    const j = JSON.parse(text);
    return Array.isArray(j?.[1]) ? j[1] : [];
  };
  // 키워드 그대로 + 뒤에 공백 (다음 단어 후보까지)
  const [a, b] = await Promise.allSettled([one(q), one(q + " ")]);
  const list = [...(a.value || []), ...(b.value || [])];
  const flat = s => String(s).replace(/\s+/g, "").toLowerCase();
  const seen = new Set([flat(q)]); const out = [];
  for (const s of list) { const k = flat(s); if (!k || seen.has(k)) continue; seen.add(k); out.push(s); }
  return out.slice(0, 20);
}

// ── 네이버 데이터랩 ──
function ymd(d) { return d.toISOString().slice(0, 10); }
async function naverDatalab(q) {
  const id = process.env.NAVER_CLIENT_ID, secret = process.env.NAVER_CLIENT_SECRET;
  if (!id || !secret) throw new Error("네이버 API 키 미설정");
  const end = new Date(); const start = new Date(end); start.setFullYear(end.getFullYear() - 1);
  const r = await fetch("https://openapi.naver.com/v1/datalab/search", {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Naver-Client-Id": id, "X-Naver-Client-Secret": secret },
    body: JSON.stringify({ startDate: ymd(start), endDate: ymd(end), timeUnit: "week", keywordGroups: [{ groupName: q, keywords: [q] }] }),
  });
  const j = await r.json().catch(() => null);
  if (!r.ok) {
    const msg = j?.errorMessage || j?.message || ("응답 " + r.status);
    if (r.status === 401 || r.status === 403) throw new Error("데이터랩 API 권한 없음 — 네이버 개발자센터 앱에 '데이터랩(검색어트렌드)'를 추가해주세요 (" + msg + ")");
    throw new Error(msg);
  }
  const data = j?.results?.[0]?.data || [];
  return data.map(x => ({ date: x.period, value: Math.round(x.ratio * 10) / 10 }));
}

// ── 구글 트렌드 (집 PC 프록시) ──
async function googleTrend(q) {
  const proxyUrl = process.env.HOME_PROXY_URL, proxyKey = process.env.HOME_PROXY_KEY;
  if (!proxyUrl || !proxyKey) throw new Error("프록시 미설정");
  const r = await fetch(`${proxyUrl}/google-trend?keyword=${encodeURIComponent(q)}&key=${encodeURIComponent(proxyKey)}`);
  if (r.status === 404) throw new Error("집 PC 프록시에 구글 트렌드 기능 없음 (server.js 업데이트 필요)");
  const j = await r.json().catch(() => null);
  if (!r.ok || !j || j.error) throw new Error(j?.error || ("프록시 응답 " + r.status));
  return j; // { series:[{date,value}], top:[{query,value}], rising:[{query,value}] }
}

export default async function handler(req, res) {
  if (!requireAuth(req, res)) return;
  const q = String(req.query.keyword || "").trim();
  if (!q) return res.status(400).json({ error: "keyword 필요" });

  const [s, n, g] = await Promise.allSettled([
    withTimeout(googleSuggest(q), 8000),
    withTimeout(naverDatalab(q), 10000),
    withTimeout(googleTrend(q), 25000),
  ]);
  res.status(200).json({
    keyword: q,
    suggest: s.status === "fulfilled" ? s.value : [],
    suggestError: s.status === "rejected" ? s.reason?.message : null,
    naver: n.status === "fulfilled" ? n.value : [],
    naverError: n.status === "rejected" ? n.reason?.message : null,
    google: g.status === "fulfilled" ? (g.value.series || []) : [],
    googleTop: g.status === "fulfilled" ? (g.value.top || []) : [],
    googleRising: g.status === "fulfilled" ? (g.value.rising || []) : [],
    googleError: g.status === "rejected" ? g.reason?.message : null,
  });
}
