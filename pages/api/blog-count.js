// pages/api/blog-count.js
// 네이버 Search API date 필터로 실제 월 발행량 정확 계산
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

    // ── 2. 최근 30일 발행량 정확 계산 ──────────────────────────────
    const now = new Date();
    const oneMonthAgo = new Date(now);
    oneMonthAgo.setDate(now.getDate() - 30);

    // 최신순 100개 가져오기
    const r2 = await fetch(
      `https://openapi.naver.com/v1/search/blog.json?query=${encodeURIComponent(keyword)}&display=100&start=1&sort=date`,
      { headers }
    );
    const d2 = await r2.json();
    const items = (d2.items || []);

    let monthly = null;

    if (items.length > 0) {
      const recentItems = items.filter(item => {
        const d = new Date(item.pubDate);
        return !isNaN(d) && d >= oneMonthAgo;
      });

      if (recentItems.length === 100) {
        // 100개 전부 30일 이내 → 일일 평균 × 30으로 추정
        const dates = recentItems.map(i => new Date(i.pubDate)).sort((a, b) => a - b);
        const oldest = dates[0];
        const daysDiff = Math.max(1, (now - oldest) / (1000 * 60 * 60 * 24));
        const dailyAvg = 100 / daysDiff;
        monthly = Math.round(dailyAvg * 30);
      } else if (recentItems.length > 0) {
        // 30일 이내 직접 카운트 (가장 정확)
        monthly = recentItems.length;
      } else {
        // 최근 100개가 모두 30일 이전 → 매우 드문 키워드
        const dates = items.map(i => new Date(i.pubDate)).filter(d => !isNaN(d)).sort((a,b) => b-a);
        if (dates.length >= 2) {
          const newest = dates[0];
          const oldest = dates[dates.length - 1];
          const daysDiff = Math.max(1, (newest - oldest) / (1000 * 60 * 60 * 24));
          monthly = Math.round((items.length / daysDiff) * 30);
        } else {
          monthly = 0;
        }
      }
    }

    res.status(200).json({ total, monthly });

  } catch (err) {
    res.status(200).json({ total: null, monthly: null, error: err.message });
  }
}
