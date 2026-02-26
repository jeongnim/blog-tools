// pages/api/blog-count.js
// 네이버 Search API로 월 블로그 발행량 추정
export const config = { maxDuration: 30 };

export default async function handler(req, res) {
  const { keyword } = req.query;
  if (!keyword) return res.status(400).json({ error: "keyword 필요" });

  const clientId = process.env.NAVER_CLIENT_ID;
  const clientSecret = process.env.NAVER_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    return res.status(200).json({ total: null, monthly: null, error: "NAVER_CLIENT_ID/SECRET 없음" });
  }

  const headers = {
    "X-Naver-Client-Id": clientId,
    "X-Naver-Client-Secret": clientSecret,
  };

  try {
    // ① 전체 게시물 수
    const r1 = await fetch(
      `https://openapi.naver.com/v1/search/blog.json?query=${encodeURIComponent(keyword)}&display=1&sort=sim`,
      { headers }
    );
    const d1 = await r1.json();
    if (d1.errorCode) return res.status(200).json({ total: null, monthly: null, error: d1.errorMessage });
    const total = d1.total || 0;

    // ② 최신 100개 pubDate → 일 평균 계산 → 30일치
    const r2 = await fetch(
      `https://openapi.naver.com/v1/search/blog.json?query=${encodeURIComponent(keyword)}&display=100&start=1&sort=date`,
      { headers }
    );
    const d2 = await r2.json();
    const items = d2.items || [];

    let monthly = null;
    if (items.length >= 2) {
      // 가장 오래된 것과 최신 것의 날짜 차이로 일 평균 계산
      const dates = items
        .map(i => new Date(i.pubDate))
        .filter(d => !isNaN(d))
        .sort((a, b) => b - a);

      if (dates.length >= 2) {
        const newest = dates[0];
        const oldest = dates[dates.length - 1];
        const daysDiff = Math.max(1, (newest - oldest) / (1000 * 60 * 60 * 24));
        const dailyAvg = dates.length / daysDiff;
        monthly = Math.round(dailyAvg * 30);
      } else {
        // pubDate 파싱 실패시 1달 이내 직접 카운트
        const oneMonthAgo = new Date();
        oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
        monthly = items.filter(i => new Date(i.pubDate) >= oneMonthAgo).length;
      }
    }

    res.status(200).json({ total, monthly });
  } catch (err) {
    res.status(200).json({ total: null, monthly: null, error: err.message });
  }
}
