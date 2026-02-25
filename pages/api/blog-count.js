// pages/api/blog-count.js
// 네이버 Search API로 월 블로그 발행량 조회
export const config = { maxDuration: 30 };

export default async function handler(req, res) {
  const { keyword } = req.query;
  if (!keyword) return res.status(400).json({ error: "keyword 필요" });

  const clientId = process.env.NAVER_CLIENT_ID;
  const clientSecret = process.env.NAVER_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    return res.status(200).json({ total: null, monthly: null, error: "NAVER_CLIENT_ID/SECRET 없음" });
  }

  try {
    // ① 최신 100개 가져와서 pubDate로 1개월치 비율 계산
    const url = `https://openapi.naver.com/v1/search/blog.json?query=${encodeURIComponent(keyword)}&display=100&start=1&sort=date`;
    const response = await fetch(url, {
      headers: {
        "X-Naver-Client-Id": clientId,
        "X-Naver-Client-Secret": clientSecret,
      },
    });
    const data = await response.json();
    if (data.errorCode) return res.status(200).json({ total: null, monthly: null, error: data.errorMessage });

    const total = data.total || 0;
    const items = data.items || [];

    // ② 1개월 이내 게시물 카운트
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

    let monthlyCount = 0;
    for (const item of items) {
      const pubDate = new Date(item.pubDate);
      if (pubDate >= oneMonthAgo) monthlyCount++;
    }

    // ③ 월 발행량 추정
    // 방법1: 100개 샘플에서 직접 카운트 (가장 정확, 단 최대 100건)
    // 방법2: 비율 기반 추정 (전체가 더 클 때)
    const ratio = items.length > 0 ? monthlyCount / items.length : 0;
    const estimated = Math.round(total * ratio);

    // 실제 카운트가 더 신뢰할 수 있으면 그걸 사용
    // 샘플 100개 중 1개월치가 100개 미만이면 실제값, 100개면 비율 추정
    const monthly = monthlyCount < items.length ? monthlyCount : estimated;

    res.status(200).json({ 
      total,           // 전체 누적 게시물
      monthly,         // 월 발행량
      sampleSize: items.length,
      monthlyInSample: monthlyCount,
    });
  } catch (err) {
    res.status(200).json({ total: null, monthly: null, error: err.message });
  }
}
