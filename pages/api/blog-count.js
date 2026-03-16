// pages/api/blog-count.js
export const config = { maxDuration: 30 };

// pubDate 파싱 (네이버 RSS 형식 대응)
function parsePubDate(str) {
  if (!str) return null;
  // "20250316" 형식 (네이버 광고 API)
  if (/^\d{8}$/.test(str)) {
    return new Date(str.slice(0,4)+"-"+str.slice(4,6)+"-"+str.slice(6,8));
  }
  // RFC 2822 형식: "Mon, 16 Mar 2026 12:00:00 +0900"
  const d = new Date(str);
  if (!isNaN(d)) return d;
  return null;
}

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
    // ── 1. 전체 누적 게시물 수
    const r1 = await fetch(
      `https://openapi.naver.com/v1/search/blog.json?query=${encodeURIComponent(keyword)}&display=1&sort=sim`,
      { headers }
    );
    const d1 = await r1.json();
    const total = (!d1.errorCode && d1.total) ? d1.total : null;

    // ── 2. 최신순 100개로 30일 발행량 추정
    const now = new Date();
    const oneMonthAgo = new Date(now);
    oneMonthAgo.setDate(now.getDate() - 30);

    const r2 = await fetch(
      `https://openapi.naver.com/v1/search/blog.json?query=${encodeURIComponent(keyword)}&display=100&start=1&sort=date`,
      { headers }
    );
    const d2 = await r2.json();
    const items = d2.items || [];

    let monthly = null;

    if (items.length > 0) {
      // pubDate 파싱
      const parsedItems = items
        .map(i => ({ ...i, _date: parsePubDate(i.postdate || i.pubDate) }))
        .filter(i => i._date !== null);

      const recentItems = parsedItems.filter(i => i._date >= oneMonthAgo);

      if (recentItems.length === 100) {
        // 100개 전부 30일 이내 → 가장 오래된 날짜 기준으로 일평균 × 30
        const dates = recentItems.map(i => i._date).sort((a, b) => a - b);
        const daysDiff = Math.max(1, (now - dates[0]) / (1000 * 60 * 60 * 24));
        monthly = Math.round((100 / daysDiff) * 30);
      } else if (recentItems.length > 0) {
        // 30일 이내 직접 카운트
        // 하지만 Search API는 최대 100개 → 실제론 더 많을 수 있으므로 보정
        // total 기준으로 비율 보정 적용
        if (total && parsedItems.length > 0) {
          const dates = parsedItems.map(i => i._date).sort((a,b) => a - b);
          const spanDays = Math.max(1, (now - dates[0]) / (1000 * 60 * 60 * 24));
          // 샘플 기간 내 daily 평균 × 30
          const dailyAvg = parsedItems.length / spanDays;
          monthly = Math.round(dailyAvg * 30);
        } else {
          monthly = recentItems.length;
        }
      } else if (parsedItems.length > 0) {
        // 최근 100개가 모두 30일 이전 → 매우 저빈도 키워드
        const dates = parsedItems.map(i => i._date).sort((a,b) => b - a);
        const spanDays = Math.max(1, (dates[0] - dates[dates.length-1]) / (1000 * 60 * 60 * 24));
        monthly = Math.round((parsedItems.length / spanDays) * 30);
      } else {
        monthly = 0;
      }
    }

    res.status(200).json({ total, monthly });

  } catch (err) {
    res.status(200).json({ total: null, monthly: null, error: err.message });
  }
}
