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

  function getKSTDateInt(offsetDays = 0) {
    const kst = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Seoul" }));
    kst.setDate(kst.getDate() + offsetDays);
    const y = kst.getFullYear();
    const m = String(kst.getMonth()+1).padStart(2,"0");
    const d = String(kst.getDate()).padStart(2,"0");
    return parseInt(`${y}${m}${d}`, 10);
  }

  function toDateInt(item) {
    const s = String(item.postdate || "");
    if (s.length === 8 && /^\d{8}$/.test(s)) return parseInt(s, 10);
    return null;
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

    // ── 2. 최신순 3페이지(300개) 조회 ──
    const pages = await Promise.all(
      [1, 101, 201].map(start =>
        fetch(
          `https://openapi.naver.com/v1/search/blog.json?query=${encodeURIComponent(keyword)}&display=100&start=${start}&sort=date`,
          { headers }
        ).then(r => r.json()).catch(() => ({ items: [] }))
      )
    );
    const allDates = pages
      .flatMap(d => (d.items || []).map(toDateInt).filter(n => n !== null))
      .sort((a, b) => b - a);

    const today = getKSTDateInt(0);
    const thirtyDaysAgo = getKSTDateInt(-30);

    let monthly = null;

    if (allDates.length >= 2) {
      const dateCount = {};
      allDates.forEach(d => { dateCount[d] = (dateCount[d]||0)+1; });

      const todayCount     = dateCount[today] || 0;
      const recentCount    = allDates.filter(d => d >= thirtyDaysAgo).length;

      if (recentCount > 0 && recentCount < allDates.length) {
        // 30일 경계가 샘플 안에 있음 → 직접 카운트
        monthly = recentCount;

      } else if (recentCount === allDates.length) {
        // 300개 전부 30일 이내
        const nonTodayDates = allDates.filter(d => d < today);

        if (nonTodayDates.length >= 10) {
          // 어제치 데이터 충분 → 어제치 기반 일평균
          const oldest = nonTodayDates[nonTodayDates.length - 1];
          const oldestStr = String(oldest);
          const oldestDate = new Date(`${oldestStr.slice(0,4)}-${oldestStr.slice(4,6)}-${oldestStr.slice(6,8)}T00:00:00+09:00`);
          const yesterdayDate = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Seoul" }));
          yesterdayDate.setDate(yesterdayDate.getDate() - 1);
          yesterdayDate.setHours(0,0,0,0);
          const spanDays = Math.max(
            Math.round((yesterdayDate - oldestDate) / 86400000) + 1,
            1
          );
          monthly = Math.round((nonTodayDates.length / spanDays) * 30);

        } else {
          // 어제치 없음 → 오늘 진행률로 하루 추정
          const kst = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Seoul" }));
          const progress = Math.max((kst.getHours() * 60 + kst.getMinutes()) / 1440, 1/96);
          monthly = Math.round((todayCount / progress) * 30);
        }

      } else {
        // 전부 30일 이전 (드문 키워드)
        const newest = allDates[0];
        const oldest = allDates[allDates.length - 1];
        const newestStr = String(newest), oldestStr = String(oldest);
        const spanMs = new Date(`${newestStr.slice(0,4)}-${newestStr.slice(4,6)}-${newestStr.slice(6,8)}`) -
                       new Date(`${oldestStr.slice(0,4)}-${oldestStr.slice(4,6)}-${oldestStr.slice(6,8)}`);
        const spanDays = Math.max(spanMs / 86400000, 1);
        monthly = Math.round((allDates.length / spanDays) * 30);
      }

    } else if (allDates.length === 1) {
      monthly = total ? Math.round(total / 12) : 1;
    } else {
      monthly = total ? Math.round(total / 12) : null;
    }

    res.status(200).json({ total, monthly });

  } catch (err) {
    res.status(200).json({ total: null, monthly: null, error: err.message });
  }
}
