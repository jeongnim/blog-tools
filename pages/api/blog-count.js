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
    // ── 1. 전체 누적 게시물 수 ──────────────────────────────────────
    const r1 = await fetch(
      `https://openapi.naver.com/v1/search/blog.json?query=${encodeURIComponent(keyword)}&display=1&sort=sim`,
      { headers }
    );
    const d1 = await r1.json();
    if (d1.errorCode) {
      return res.status(200).json({ total: null, monthly: null, error: `네이버 API 오류: ${d1.errorMessage}` });
    }
    const total = d1.total ?? null;

    // ── 2. 최신순 100개 → 날짜 범위로 일평균 → 월발행량 추정 ──────
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
      // pubDate: RFC2822 "Mon, 27 Jan 2025 10:00:00 +0900" → new Date()로 파싱
      const dates = items
        .map(i => new Date(i.pubDate))
        .filter(d => !isNaN(d.getTime()))
        .sort((a, b) => b - a); // 최신순 정렬

      if (dates.length >= 2) {
        const newest = dates[0];
        const oldest = dates[dates.length - 1];

        // 30일 이내 직접 카운트
        const recentCount = dates.filter(d => d >= oneMonthAgo).length;

        if (recentCount > 0 && recentCount < dates.length) {
          // 일부만 30일 이내 → 직접 카운트가 가장 정확
          monthly = recentCount;

        } else if (recentCount === dates.length) {
          // 전부 30일 이내 → 날짜 범위로 일평균 계산 (시간 단위 정밀)
          // 예: 100개가 2시간 범위 → 하루 1,200개 → 월 36,000개
          const spanMs = Math.max(newest - oldest, 30 * 60 * 1000); // 최소 30분
          const spanDays = spanMs / (1000 * 60 * 60 * 24);
          monthly = Math.round((dates.length / spanDays) * 30);

        } else {
          // 전부 30일 이전 → 드문 키워드
          const spanMs = Math.max(newest - oldest, 24 * 60 * 60 * 1000);
          const spanDays = spanMs / (1000 * 60 * 60 * 24);
          monthly = Math.round((dates.length / spanDays) * 30);
        }
      } else if (dates.length === 1) {
        // 게시글 1개 → total 기반 추정
        monthly = total ? Math.round(total / 12) : 1;
      }
    }

    res.status(200).json({ total, monthly });

  } catch (err) {
    res.status(200).json({ total: null, monthly: null, error: err.message });
  }
}
