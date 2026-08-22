// ═══════════════════════════════════════════════════════════════════════════
//  C:\naver-proxy\server.js 에 추가할 엔드포인트
//  기존 app.get("/naver-search-areas", ...) 아래 아무 곳에나 붙여넣고
//  node server.js 재시작하면 됩니다. 별도 패키지 설치 없음.
//
//  하는 일: 네이버 블로그탭을 기간 필터로 검색해서 "총 건수"만 읽어옵니다.
//    - 기간 없음  → 누적 발행량 (total)
//    - 이번 달 1일~오늘 → 이번 달 발행량 (monthly)
//  요청 2번으로 끝나므로 매일 수집해서 DB에 쌓을 필요가 없습니다.
// ═══════════════════════════════════════════════════════════════════════════

const BLOG_UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";

// KST 기준 오늘 / 이번 달 1일
function kstToday() {
  const kst = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Seoul" }));
  return kst;
}
function ymd(d, sep = ".") {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return [y, m, day].join(sep);
}

// 블로그탭 검색 URL 생성
// period 가 있으면 nso 파라미터로 기간을 건다 (from~to, 일 단위)
function buildBlogTabUrl(keyword, from, to) {
  const base = "https://search.naver.com/search.naver?ssc=tab.blog.all&sm=tab_jum&query=" +
    encodeURIComponent(keyword);
  if (!from || !to) return base;
  const f = ymd(from, ""); // YYYYMMDD
  const t = ymd(to, "");
  return base +
    `&nso=so%3Ar%2Cp%3Afrom${f}to${t}` +
    `&date_from=${f}&date_to=${t}&date_option=8`;
}

// 검색결과 페이지에서 총 건수 파싱
// 네이버가 표기 위치를 자주 바꾸므로 여러 패턴을 순서대로 시도한다.
function parseTotalCount(html) {
  const patterns = [
    // "총 1,234,567건"
    /총\s*<span[^>]*>([\d,]+)<\/span>\s*건/i,
    /총\s*([\d,]+)\s*건/,
    // JSON 형태로 박혀 오는 경우
    /"totalCount"\s*:\s*"?([\d,]+)"?/i,
    /"total"\s*:\s*"?([\d,]+)"?/i,
    // 접근성 텍스트
    /검색결과\s*([\d,]+)\s*건/,
  ];
  for (const re of patterns) {
    const m = html.match(re);
    if (m && m[1]) {
      const n = parseInt(String(m[1]).replace(/,/g, ""), 10);
      if (!isNaN(n)) return n;
    }
  }
  return null;
}

// 총 건수 표기를 못 찾았을 때: 결과 카드 개수라도 세어 하한값으로 쓴다
function countResultItems(html) {
  const m = html.match(/blog\.naver\.com\/[A-Za-z0-9_-]+\/\d+/g);
  if (!m) return null;
  return new Set(m).size;
}

async function fetchBlogTabCount(keyword, from, to) {
  const url = buildBlogTabUrl(keyword, from, to);
  const r = await fetch(url, {
    headers: {
      "User-Agent": BLOG_UA,
      "Accept": "text/html,application/xhtml+xml,*/*",
      "Accept-Language": "ko-KR,ko;q=0.9",
      "Referer": "https://search.naver.com/",
    },
  });
  if (!r.ok) throw new Error(`네이버 응답 ${r.status}`);
  const html = await r.text();

  const total = parseTotalCount(html);
  if (total !== null) return { count: total, exact: true };

  const approx = countResultItems(html);
  return { count: approx, exact: false };
}

app.get("/naver-blog-count", async (req, res) => {
  const { keyword, key } = req.query;

  // 기존 엔드포인트와 동일한 키 검증 방식을 쓰세요.
  // server.js 에 이미 PROXY_KEY 상수가 있으면 그대로 사용하면 됩니다.
  if (key !== PROXY_KEY) {
    return res.status(401).json({ success: false, error: "인증 실패" });
  }
  if (!keyword) {
    return res.status(400).json({ success: false, error: "keyword 필요" });
  }

  try {
    const today = kstToday();
    const firstOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    // 누적 / 이번 달을 순차 조회 (동시에 던지면 차단 확률이 올라갑니다)
    const totalRes = await fetchBlogTabCount(keyword);
    await new Promise(r => setTimeout(r, 600));   // 짧은 간격
    const monthRes = await fetchBlogTabCount(keyword, firstOfMonth, today);

    res.json({
      success: true,
      keyword,
      total: totalRes.count,
      monthly: monthRes.count,
      exact: totalRes.exact && monthRes.exact,
      monthLabel: `${today.getFullYear()}년 ${today.getMonth() + 1}월 1일~${today.getDate()}일`,
      from: ymd(firstOfMonth),
      to: ymd(today),
    });
  } catch (e) {
    res.status(200).json({ success: false, error: e.message || "조회 실패" });
  }
});
