// pages/api/blog-count.js
// 발행량 집계 — 네이버 검색 API만 사용 (집 PC 프록시 불필요)
//
// 방식: 최신순으로 최대 1,000개를 받아 이번 달 글을 직접 센다.
//   - 표본 안에 지난달 글이 섞여 있으면 → 이번 달 경계를 넘었다는 뜻이므로 실제 개수 (exact)
//   - 1,000개가 전부 이번 달이면 → 그보다 많다는 뜻이므로 일평균으로 환산 (추정)
// 판단이 갈리는 구간(월 수십~수백 건)에서는 항상 정확한 값이 나온다.
import { requireAuth } from "../../lib/auth";

export const config = { maxDuration: 30 };

const PAGES = [1, 101, 201, 301, 401, 501, 601, 701, 801, 901];   // 검색 API start 상한 1000

function kstNow() {
  return new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Seoul" }));
}

function toDateInt(item) {
  const s = String(item.postdate || "");
  return /^\d{8}$/.test(s) ? parseInt(s, 10) : null;
}

function dateIntToDate(n) {
  const s = String(n);
  return new Date(`${s.slice(0, 4)}-${s.slice(4, 6)}-${s.slice(6, 8)}T00:00:00+09:00`);
}

export default async function handler(req, res) {
  if (!requireAuth(req, res)) return;

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

  const q = encodeURIComponent(keyword);

  try {
    // ── 1. 누적 발행량 ──
    const r1 = await fetch(
      `https://openapi.naver.com/v1/search/blog.json?query=${q}&display=1&sort=sim`,
      { headers }
    );
    const d1 = await r1.json();
    if (d1.errorCode) {
      return res.status(200).json({ total: null, monthly: null, error: `네이버 API 오류: ${d1.errorMessage}` });
    }
    const total = d1.total ?? null;

    // ── 2. 최신순 1,000개 (100개씩 10페이지) ──
    const pages = await Promise.all(
      PAGES.map(start =>
        fetch(
          `https://openapi.naver.com/v1/search/blog.json?query=${q}&display=100&start=${start}&sort=date`,
          { headers }
        ).then(r => r.json()).catch(() => ({ items: [] }))
      )
    );

    const dates = pages
      .flatMap(d => (d.items || []).map(toDateInt).filter(n => n !== null))
      .sort((a, b) => b - a);

    if (dates.length === 0) {
      return res.status(200).json({
        total, monthly: null, exact: false, source: "searchapi",
        error: "최신 글을 찾지 못했습니다.",
      });
    }

    const today = kstNow();
    const y = today.getFullYear();
    const m = today.getMonth() + 1;
    const monthStartInt = parseInt(`${y}${String(m).padStart(2, "0")}01`, 10);
    const monthLabel = `${y}년 ${m}월 1일~${today.getDate()}일`;

    const thisMonth = dates.filter(d => d >= monthStartInt);
    const sampleCoversBoundary = thisMonth.length < dates.length;

    // ── 경계가 표본 안에 있음 → 실제 개수 ──
    if (sampleCoversBoundary) {
      return res.status(200).json({
        total,
        monthly: thisMonth.length,
        exact: true,
        capped: false,
        sampled: dates.length,
        monthLabel,
        source: "searchapi",
      });
    }

    // ── 1,000개가 전부 이번 달 → 하한값 + 일평균 환산 ──
    // 오늘은 아직 진행 중이라 일평균 계산에서 빼고, 어제까지로 속도를 잡는다.
    const todayInt = parseInt(`${y}${String(m).padStart(2, "0")}${String(today.getDate()).padStart(2, "0")}`, 10);
    const beforeToday = dates.filter(d => d < todayInt);

    let estimate = null;
    if (beforeToday.length >= 10) {
      const oldest = dateIntToDate(beforeToday[beforeToday.length - 1]);
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      yesterday.setHours(0, 0, 0, 0);
      const spanDays = Math.max(Math.round((yesterday - oldest) / 86400000) + 1, 1);
      const perDay = beforeToday.length / spanDays;
      estimate = Math.round(perDay * today.getDate());
    }

    return res.status(200).json({
      total,
      monthly: estimate ?? dates.length,
      exact: false,
      capped: true,                 // 최소 dates.length 이상이라는 뜻
      atLeast: dates.length,
      sampled: dates.length,
      monthLabel,
      source: "searchapi",
    });

  } catch (err) {
    res.status(200).json({ total: null, monthly: null, error: err.message });
  }
}
