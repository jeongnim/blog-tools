// pages/api/naver-adult.js
// 네이버 "성인 검색어 판별" (NAVER API HUB) — 검색어가 네이버에서 성인 검색어로 분류되는지 0/1로 알려준다.
// 여러 개를 한 번에: /api/naver-adult?q=키워드1&q=키워드2 (최대 20개, 같은 말은 한 번만 조회)
// 한도: 검색 API와 공유, 하루 25,000회 (무료)
import { requireAuth } from "../../lib/auth";

export const config = { maxDuration: 20 };

const CACHE = new Map();               // 인스턴스 메모리 캐시 (같은 말 반복 조회 방지)
const TTL = 24 * 60 * 60 * 1000;

async function checkOne(q, id, secret) {
  const hit = CACHE.get(q);
  if (hit && Date.now() - hit.at < TTL) return hit.v;
  const r = await fetch(`https://naverapihub.apigw.ntruss.com/search/v1/adult?query=${encodeURIComponent(q)}&format=json`, {
    headers: { "X-NCP-APIGW-API-KEY-ID": id, "X-NCP-APIGW-API-KEY": secret },
  });
  const j = await r.json().catch(() => null);
  if (!r.ok) throw new Error(j?.error?.message || j?.errorMessage || ("응답 " + r.status));
  const v = String(j?.adult) === "1";
  CACHE.set(q, { at: Date.now(), v });
  if (CACHE.size > 5000) CACHE.delete(CACHE.keys().next().value);
  return v;
}

export default async function handler(req, res) {
  if (!requireAuth(req, res)) return;
  const id = process.env.NAVER_HUB_CLIENT_ID, secret = process.env.NAVER_HUB_CLIENT_SECRET;
  if (!id || !secret) return res.status(200).json({ error: "NAVER API HUB 키 미설정 (Vercel에 NAVER_HUB_CLIENT_ID / NAVER_HUB_CLIENT_SECRET)", results: [] });

  const raw = [].concat(req.query.q || []).map(x => String(x).trim()).filter(Boolean);
  const list = [...new Set(raw)].slice(0, 20);
  if (!list.length) return res.status(400).json({ error: "q 필요" });

  const results = [];
  for (const q of list) {               // 순서대로 (초당 호출 몰림 방지)
    try { results.push({ query: q, adult: await checkOne(q, id, secret) }); }
    catch (e) { results.push({ query: q, adult: null, error: e.message }); }
  }
  res.status(200).json({ results });
}
