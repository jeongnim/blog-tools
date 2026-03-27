// pages/api/blog-count.js
export const config = { maxDuration: 30 };

export default async function handler(req, res) {
  const { keyword } = req.query;
  if (!keyword) return res.status(400).json({ error: "keyword 필요" });

  const clientId     = process.env.NAVER_CLIENT_ID;
  const clientSecret = process.env.NAVER_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    return res.status(200).json({ total: null, monthly: null, error: "API 키 없음" });
  }

  const headers = {
    "X-Naver-Client-Id": clientId,
    "X-Naver-Client-Secret": clientSecret,
  };

  try {
    // ── 1. 전체 누적 게시물 수 ──
    const r1 = await fetch(
      `https://openapi.naver.com/v1/search/blog.json?query=${encodeURIComponent(keyword)}&display=1&sort=sim`,
      { headers }
    );
    const d1 = await r1.json();
    if (d1.errorCode) {
      return res.status(200).json({ total: null, monthly: null, error: `네이버 API 오류: ${d1.errorMessage}` });
    }
    const total = d1.total ?? null;

    // ── 2. 최신순 100개 조회 ──
    const r2 = await fetch(
      `https://openapi.naver.com/v1/search/blog.json?query=${encodeURIComponent(keyword)}&display=100&start=1&sort=date`,
      { headers }
    );
    const d2 = await r2.json();
    const items = d2.items || [];

    // 디버그: 첫 번째 아이템 원본 확인
    const firstItem = items[0] || null;
    const debugInfo = {
      itemCount: items.length,
      firstPubDate: firstItem?.pubDate || null,
      firstPostdate: firstItem?.postdate || null,
      d2error: d2.errorCode || null,
    };

    // 날짜 파싱: pubDate(RFC2822) 또는 postdate(YYYYMMDD) 둘 다 지원
    function parseItemDate(item) {
      if (item.pubDate) {
        const d = new Date(item.pubDate);
        if (!isNaN(d.getTime())) return d;
      }
      if (item.postdate) {
        const s = String(item.postdate);
        if (s.length === 8) {
          const d = new Date(`${s.slice(0,4)}-${s.slice(4,6)}-${s.slice(6,8)}`);
          if (!isNaN(d.getTime())) return d;
        }
      }
      return null;
    }

    const now = new Date();
    const oneMonthAgo = new Date(now);
    oneMonthAgo.setDate(now.getDate() - 30);

    let monthly = null;

    if (items.length > 0) {
      const dates = items
        .map(parseItemDate)
        .filter(d => d !== null)
        .sort((a, b) => b - a);

      debugInfo.parsedCount = dates.length;
      debugInfo.newestDate = dates[0]?.toISOString() || null;
      debugInfo.oldestDate = dates[dates.length-1]?.toISOString() || null;

      if (dates.length >= 2) {
        const newest = dates[0];
        const oldest = dates[dates.length - 1];
        const recentCount = dates.filter(d => d >= oneMonthAgo).length;

        debugInfo.recentCount = recentCount;

        if (recentCount > 0 && recentCount < dates.length) {
          monthly = recentCount;
        } else if (recentCount === dates.length) {
          const spanMs = Math.max(newest - oldest, 30 * 60 * 1000);
          const spanDays = spanMs / (1000 * 60 * 60 * 24);
          debugInfo.spanDays = spanDays;
          monthly = Math.round((dates.length / spanDays) * 30);
        } else {
          const spanMs = Math.max(newest - oldest, 24 * 60 * 60 * 1000);
          const spanDays = spanMs / (1000 * 60 * 60 * 24);
          monthly = Math.round((dates.length / spanDays) * 30);
        }
      } else if (dates.length === 1) {
        monthly = total ? Math.round(total / 12) : 1;
      } else {
        // 날짜 파싱 전부 실패
        monthly = total ? Math.round(total / 12) : null;
        debugInfo.parseFailReason = "all dates failed to parse";
      }
    }

    res.status(200).json({ total, monthly, _debug: debugInfo });

  } catch (err) {
    res.status(200).json({ total: null, monthly: null, error: err.message });
  }
}
