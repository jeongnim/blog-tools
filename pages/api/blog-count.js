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

  // postdate "YYYYMMDD" → YYYYMMDD 정수 반환 (비교용)
  function parsePostdateInt(item) {
    const s = String(item.postdate || "");
    if (s.length === 8 && /^\d{8}$/.test(s)) return parseInt(s, 10);
    return null;
  }

  // 오늘 날짜 YYYYMMDD 정수 (KST)
  function todayInt() {
    const kst = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Seoul" }));
    const y = kst.getFullYear();
    const m = String(kst.getMonth()+1).padStart(2,"0");
    const d = String(kst.getDate()).padStart(2,"0");
    return parseInt(`${y}${m}${d}`, 10);
  }

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

    // ── 2. 최신순 3페이지(300개) 병렬 조회 ──
    const pages = await Promise.all(
      [1, 101, 201].map(start =>
        fetch(
          `https://openapi.naver.com/v1/search/blog.json?query=${encodeURIComponent(keyword)}&display=100&start=${start}&sort=date`,
          { headers }
        ).then(r => r.json()).catch(() => ({ items: [] }))
      )
    );
    const items = pages.flatMap(d => d.items || []);

    let monthly = null;

    if (items.length > 0) {
      const today = todayInt();
      const yesterday = today - 1; // 간이 계산 (월말 등 예외 무시)
      const thirtyDaysAgo = (() => {
        const kst = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Seoul" }));
        kst.setDate(kst.getDate() - 30);
        const y = kst.getFullYear();
        const m = String(kst.getMonth()+1).padStart(2,"0");
        const d = String(kst.getDate()).padStart(2,"0");
        return parseInt(`${y}${m}${d}`, 10);
      })();

      const dates = items.map(parsePostdateInt).filter(d => d !== null).sort((a,b) => b-a);

      if (dates.length >= 2) {
        const newest = dates[0];
        const oldest = dates[dates.length - 1];

        // 날짜별 카운트
        const dateCount = {};
        dates.forEach(d => { dateCount[d] = (dateCount[d]||0) + 1; });
        const uniqueDays = Object.keys(dateCount).map(Number).sort((a,b)=>b-a);

        // 30일 이내 직접 카운트
        const recentDates = dates.filter(d => d >= thirtyDaysAgo);

        if (recentDates.length > 0 && recentDates.length < dates.length) {
          // 일부만 30일 이내 → 직접 카운트
          monthly = recentDates.length;

        } else if (recentDates.length === dates.length) {
          // 전부 30일 이내 (인기 키워드: 300개가 며칠치)
          const spanDays = Math.max(newest - oldest, 1); // YYYYMMDD 단순 차이 (일 단위)

          if (spanDays >= 2) {
            // 며칠에 걸쳐 있음 → 일평균 × 30
            // 오늘이 아직 끝나지 않았으면 오늘 카운트 보정 (현재시간/24)
            const kst = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Seoul" }));
            const hourProgress = (kst.getHours() * 60 + kst.getMinutes()) / (24 * 60); // 0~1
            const todayCount = dateCount[today] || 0;
            const adjustedTodayCount = hourProgress > 0.1 ? Math.round(todayCount / hourProgress) : todayCount;
            const totalAdjusted = dates.length - todayCount + adjustedTodayCount;
            const dailyAvg = totalAdjusted / (spanDays + 1);
            monthly = Math.round(dailyAvg * 30);
          } else {
            // 전부 오늘 날짜 (spanDays=0) → 오늘 진행률로 보정
            const kst = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Seoul" }));
            const hourProgress = Math.max((kst.getHours() * 60 + kst.getMinutes()) / (24 * 60), 0.01);
            const todayCount = dateCount[today] || dates.length;
            // 오늘 하루 추정치: 현재까지 N개면 하루 N/progress개
            const estimatedDaily = Math.round(todayCount / hourProgress);
            monthly = estimatedDaily * 30;
          }

        } else {
          // 전부 30일 이전 → 드문 키워드
          const spanDays = Math.max(newest - oldest, 1);
          monthly = Math.round((dates.length / spanDays) * 30);
        }

      } else if (dates.length === 1) {
        monthly = total ? Math.round(total / 12) : 1;
      } else {
        monthly = total ? Math.round(total / 12) : null;
      }
    }

    res.status(200).json({ total, monthly });

  } catch (err) {
    res.status(200).json({ total: null, monthly: null, error: err.message });
  }
}
