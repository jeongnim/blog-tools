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

    // ── 2. 월 발행량: 최신순 3페이지(300개) 가져와서 30일 이내 카운트 ──
    const now = new Date();
    const oneMonthAgo = new Date(now);
    oneMonthAgo.setDate(now.getDate() - 30);

    // 최신순 최대 300개 (3회 요청, 각 100개) 병렬 조회
    const pages = await Promise.all([1, 101, 201].map(start =>
      fetch(
        `https://openapi.naver.com/v1/search/blog.json?query=${encodeURIComponent(keyword)}&display=100&start=${start}&sort=date`,
        { headers }
      ).then(r => r.json()).catch(() => ({ items: [] }))
    ));

    const allItems = pages.flatMap(d => d.items || []);

    let monthly = null;

    if (allItems.length > 0) {
      // 30일 이내 직접 카운트
      const recentItems = allItems.filter(item => {
        const d = new Date(item.pubDate);
        return !isNaN(d) && d >= oneMonthAgo;
      });

      if (recentItems.length > 0 && recentItems.length < allItems.length) {
        // 300개 중 일부만 30일 이내 → 가장 정확한 직접 카운트
        monthly = recentItems.length;
      } else if (recentItems.length === allItems.length) {
        // 300개 전부 30일 이내 → 여전히 더 많음. total 기반 추정
        // 전체 누적 수 대비 최근 30일 비율을 최신 300개 날짜 범위로 추정
        const dates = recentItems.map(i => new Date(i.pubDate)).sort((a, b) => a - b);
        const oldest = dates[0];
        const newest = dates[dates.length - 1];
        const spanDays = Math.max(1, (newest - oldest) / (1000 * 60 * 60 * 24));

        if (spanDays >= 5) {
          // 날짜 범위가 5일 이상이면 선형 추정
          const dailyAvg = recentItems.length / spanDays;
          monthly = Math.round(dailyAvg * 30);
        } else {
          // 날짜 범위가 너무 좁으면 total 기반 추정 (전체의 1/12 가정)
          monthly = total ? Math.round(total / 12) : null;
        }
      } else {
        // allItems가 모두 30일 이전 → 매우 드문 키워드
        const dates = allItems.map(i => new Date(i.pubDate)).filter(d => !isNaN(d)).sort((a, b) => b - a);
        if (dates.length >= 2) {
          const newest = dates[0];
          const oldest = dates[dates.length - 1];
          const daysDiff = Math.max(1, (newest - oldest) / (1000 * 60 * 60 * 24));
          monthly = Math.round((allItems.length / daysDiff) * 30);
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
