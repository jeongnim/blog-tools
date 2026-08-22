// pages/api/trending-keywords.js
// 트렌드 키워드 소스 통합 — 구글 트렌드(일간 RSS) + 네이버 블로그 주제별 인기글
// 판다랭크·signal.bz 크롤링은 쓰지 않는다. 두 소스 모두 공개 경로만 사용.
export const config = { maxDuration: 20 };

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";

// 실시간 트렌드라 해도 매 요청 크롤링할 이유는 없다 (프로세스 메모리 캐시)
const CACHE_TTL = 12 * 60 * 1000;
const cache = new Map();   // key → { at, data }

function getCached(key) {
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < CACHE_TTL) return hit.data;
  return null;
}
function setCached(key, data) {
  cache.set(key, { at: Date.now(), data });
}

function stripTags(s = "") {
  return String(s).replace(/<[^>]+>/g, "").replace(/&#?\w+;/g, " ").trim();
}

// ── 구글 트렌드: 한국 일간 인기 급상승 검색어 (공개 RSS) ──
async function fetchGoogleTrends() {
  const cached = getCached("google");
  if (cached) return cached;

  const urls = [
    "https://trends.google.com/trending/rss?geo=KR",
    "https://trends.google.co.kr/trends/trendingsearches/daily/rss?geo=KR",
  ];

  for (const url of urls) {
    try {
      const r = await fetch(url, {
        headers: { "User-Agent": UA, Accept: "application/rss+xml, application/xml, text/xml, */*" },
        signal: AbortSignal.timeout(8000),
      });
      if (!r.ok) continue;
      const xml = await r.text();
      if (!xml.includes("<item")) continue;

      const items = xml.split(/<item[\s>]/i).slice(1);
      const list = items
        .map(chunk => {
          const title = stripTags(
            chunk.match(/<title>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/title>/i)?.[1] || ""
          );
          const traffic = stripTags(
            chunk.match(/<ht:approx_traffic>([\s\S]*?)<\/ht:approx_traffic>/i)?.[1] || ""
          );
          return { keyword: title, traffic: traffic || null };
        })
        .filter(x => x.keyword && x.keyword.length >= 2)
        .slice(0, 20);

      if (list.length > 0) {
        setCached("google", list);
        return list;
      }
    } catch (e) { /* 다음 URL 시도 */ }
  }
  return [];
}

// ── 네이버: 블로그 주제별 실시간 인기글 제목 ──
// naver-trending.js와 같은 엔드포인트를 서버에서 직접 호출한다.
async function fetchNaverTopPosts(dirNo) {
  const key = `naver:${dirNo}`;
  const cached = getCached(key);
  if (cached) return cached;

  try {
    const url = `https://section.blog.naver.com/ajax/DirectoryTopPostList.naver?directorySeq=${dirNo}&itemCount=20`;
    const r = await fetch(url, {
      headers: {
        "User-Agent": UA,
        Accept: "application/json, text/plain, */*",
        "Accept-Language": "ko-KR,ko;q=0.9",
        Referer: "https://section.blog.naver.com/",
      },
      signal: AbortSignal.timeout(10000),
    });
    if (!r.ok) return [];

    const text = await r.text();
    const jsonStart = text.indexOf("{");
    if (jsonStart === -1) return [];

    const data = JSON.parse(text.slice(jsonStart));
    const list = (data?.result || [])
      .map(item => stripTags(item.title || ""))
      .filter(t => t.length >= 5)
      .slice(0, 20);

    setCached(key, list);
    return list;
  } catch (e) {
    return [];
  }
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  if (req.method === "OPTIONS") return res.status(200).end();

  const dirNo = parseInt(req.query.dirNo, 10) || 0;

  const [google, naver] = await Promise.all([
    fetchGoogleTrends(),
    dirNo ? fetchNaverTopPosts(dirNo) : Promise.resolve([]),
  ]);

  res.status(200).json({
    success: google.length > 0 || naver.length > 0,
    updatedAt: new Date().toISOString(),
    google,                    // [{ keyword, traffic }]
    naverTopPosts: naver,      // ["인기글 제목", ...]
    counts: { google: google.length, naver: naver.length },
  });
}
