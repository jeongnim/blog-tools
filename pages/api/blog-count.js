// pages/api/blog-count.js
// 네이버 블로그 검색 기간필터(최근 1개월)로 실제 월 발행량 조회 — 판다랭크 방식
export const config = { maxDuration: 30 };

export default async function handler(req, res) {
  const { keyword } = req.query;
  if (!keyword) return res.status(400).json({ error: "keyword 필요" });

  const clientId     = process.env.NAVER_CLIENT_ID;
  const clientSecret = process.env.NAVER_CLIENT_SECRET;

  try {
    let total   = null;
    let monthly = null;

    // ── 방법 1: 네이버 블로그 검색 페이지 크롤링 (기간 필터 1개월) ──────────
    // nso=so:dd,p:1m → 최신순, 최근 1개월
    try {
      const searchUrl = `https://search.naver.com/search.naver?where=blog&query=${encodeURIComponent(keyword)}&nso=so:dd,p:1m`;
      const r = await fetch(searchUrl, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
          "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
          "Accept-Language": "ko-KR,ko;q=0.9",
          "Referer": "https://search.naver.com/",
        },
      });
      const html = await r.text();

      // 검색결과 총 개수 파싱
      // 패턴 예: "1개월 이내 총 <strong>1,234</strong>개" 또는 data-total="1234"
      let matched = false;

      // 패턴 1: total_count 클래스 또는 data 속성
      const m1 = html.match(/data-total="(\d+)"/);
      if (m1) { monthly = parseInt(m1[1]); matched = true; }

      // 패턴 2: "검색결과 숫자개" 형태
      if (!matched) {
        const m2 = html.match(/<span[^>]*class="[^"]*title_num[^"]*"[^>]*>([\d,]+)<\/span>/);
        if (m2) { monthly = parseInt(m2[1].replace(/,/g, "")); matched = true; }
      }

      // 패턴 3: \"total\":숫자 JSON 형태
      if (!matched) {
        const m3 = html.match(/"total"\s*:\s*(\d+)/);
        if (m3) { monthly = parseInt(m3[1]); matched = true; }
      }

      // 패턴 4: 숫자,숫자개 형태 (예: 1,234개)
      if (!matched) {
        const m4 = html.match(/([\d,]+)\s*개의?\s*블로그/);
        if (m4) { monthly = parseInt(m4[1].replace(/,/g, "")); matched = true; }
      }

      // 패턴 5: of 또는 resultCount
      if (!matched) {
        const m5 = html.match(/resultCount['":\s]+([\d,]+)/i);
        if (m5) { monthly = parseInt(m5[1].replace(/,/g, "")); matched = true; }
      }
    } catch(e) {}

    // ── 방법 2: 네이버 Search API fallback (크롤링 실패 시) ──────────────────
    if (monthly === null && clientId && clientSecret) {
      const headers = {
        "X-Naver-Client-Id": clientId,
        "X-Naver-Client-Secret": clientSecret,
      };

      // 전체 게시물 수
      const r1 = await fetch(
        `https://openapi.naver.com/v1/search/blog.json?query=${encodeURIComponent(keyword)}&display=1&sort=sim`,
        { headers }
      );
      const d1 = await r1.json();
      if (!d1.errorCode) total = d1.total || 0;

      // 최신 100개로 월 발행량 추정 (기존 방식 fallback)
      const r2 = await fetch(
        `https://openapi.naver.com/v1/search/blog.json?query=${encodeURIComponent(keyword)}&display=100&start=1&sort=date`,
        { headers }
      );
      const d2 = await r2.json();
      const items = d2.items || [];

      if (items.length >= 2) {
        const dates = items
          .map(i => new Date(i.pubDate))
          .filter(d => !isNaN(d))
          .sort((a, b) => b - a);

        if (dates.length >= 2) {
          const newest  = dates[0];
          const oldest  = dates[dates.length - 1];
          const daysDiff = Math.max(1, (newest - oldest) / (1000 * 60 * 60 * 24));
          const dailyAvg = dates.length / daysDiff;
          monthly = Math.round(dailyAvg * 30);
        } else {
          const oneMonthAgo = new Date();
          oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
          monthly = items.filter(i => new Date(i.pubDate) >= oneMonthAgo).length;
        }
      }
    }

    res.status(200).json({ total, monthly });

  } catch (err) {
    res.status(200).json({ total: null, monthly: null, error: err.message });
  }
}
