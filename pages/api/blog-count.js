// pages/api/blog-count.js
// 네이버 Search API로 월 발행량 정확 계산 (판다랭크 방식)
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
    // ── 1. 전체 누적 게시물 수 ──────────────────────────────────────
    const r1 = await fetch(
      `https://openapi.naver.com/v1/search/blog.json?query=${encodeURIComponent(keyword)}&display=1&sort=sim`,
      { headers }
    );
    const d1 = await r1.json();
    const total = (!d1.errorCode && d1.total) ? d1.total : null;

    // ── 2. 최신순 100개 가져와서 날짜 범위로 일평균 → 월발행량 추정 ──
    // 핵심: spanDays를 시간 단위로 계산해 인기 키워드도 정확히 추정
    const r2 = await fetch(
      `https://openapi.naver.com/v1/search/blog.json?query=${encodeURIComponent(keyword)}&display=100&start=1&sort=date`,
      { headers }
    );
    const d2 = await r2.json();
    const items = d2.items || [];

    const now = new Date();
    const oneMonthAgo = new Date(now);
    oneMonthAgo.setDate(now.getDate() - 30);

    let monthly = null;

    if (items.length > 0) {
      // pubDate: RFC2822 형식 "Mon, 27 Jan 2025 10:00:00 +0900"
      const dates = items
        .map(i => new Date(i.pubDate))
        .filter(d => !isNaN(d.getTime()))
        .sort((a, b) => b - a); // 최신순

      if (dates.length > 0) {
        const newest = dates[0];
        const oldest = dates[dates.length - 1];

        // 30일 이내 직접 카운트
        const recentCount = dates.filter(d => d >= oneMonthAgo).length;

        if (recentCount > 0 && recentCount < dates.length) {
          // 100개 중 일부만 30일 이내 → 30일 이내 직접 카운트가 가장 정확
          monthly = recentCount;

        } else if (recentCount === dates.length) {
          // 100개 전부 30일 이내 → 날짜 범위로 일평균 계산 (시간 단위 정밀)
          // ex: 100개가 2시간치 → 하루 1200개 → 월 36,000개
          const spanMs = Math.max(newest - oldest, 60 * 60 * 1000); // 최소 1시간
          const spanDays = spanMs / (1000 * 60 * 60 * 24);
          const dailyAvg = dates.length / spanDays;
          monthly = Math.round(dailyAvg * 30);

        } else {
          // 100개가 모두 30일 이전 → 매우 드문 키워드
          const spanMs = Math.max(newest - oldest, 24 * 60 * 60 * 1000); // 최소 1일
          const spanDays = spanMs / (1000 * 60 * 60 * 24);
          monthly = Math.round((dates.length / spanDays) * 30);
        }
      }
    }

    res.status(200).json({ total, monthly });

  } catch (err) {
    res.status(200).json({ total: null, monthly: null, error: err.message });
  }
}
