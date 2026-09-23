const express = require('express');
const app = express();

// 보안용 비밀키 (환경변수 우선, 없으면 기존 값 사용)
const SECRET_KEY = process.env.PROXY_KEY || "bandphone-secret-2026-xyz";
const PORT = parseInt(process.env.PORT || "4500", 10);

const STARTED_AT = new Date();

const COMMON_HEADERS = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
  "Accept": "text/html,application/xhtml+xml,*/*;q=0.8",
  "Accept-Language": "ko-KR,ko;q=0.9",
};

// blog.naver.com 링크를 순서대로 추출 (단순 등장순 — 블로그탭처럼 결과가 깔끔한 페이지용)
function extractBlogLinks(html) {
  const matches = [...html.matchAll(/blog\.naver\.com\/([^/"'\s?#&]+)\/(\d+)/g)];
  const seen = new Set();
  const found = [];
  for (const m of matches) {
    const blogId = m[1].toLowerCase();
    const postNo = m[2];
    if (blogId === 'naverpost' || blogId === 'naver' || blogId === 'nblog') continue;
    const key = blogId + '/' + postNo;
    if (!seen.has(key)) {
      seen.add(key);
      found.push({ blogId, postNo });
    }
  }
  return found;
}

// 통합검색(nexearch) 전용: data-cr-on="r=N&...&...kep" 의 r= 값으로 실제 노출 순위를 추출.
// 광고/관련검색/댓글 등 잡음을 피하고, "이 아이템이 몇 번째로 노출됐는지"를 네이버가 직접 박아둔 값을 사용.
function extractRankedBlogLinks(html) {
  // ugcItem(실제 검색결과 카드) 블록만 우선 분리
  const blockRegex = /data-template-id="ugcItem"[\s\S]*?(?=data-template-id="ugcItem"|<\/body>|$)/g;
  const blocks = html.match(blockRegex) || [html]; // 못 찾으면 전체에서 폴백

  const seen = new Set();
  const ranked = []; // { rank, blogId, postNo }

  for (const block of blocks) {
    // 이 블록 안의 r= 값 (가장 먼저 나오는 data-cr-on의 r=)
    const rMatch = block.match(/data-cr-on="r=(\d+)&/);
    if (!rMatch) continue;
    const r = parseInt(rMatch[1], 10);

    // 이 블록 안의 첫 blog.naver.com 링크
    const linkMatch = block.match(/blog\.naver\.com\/([^/"'\s?#&]+)\/(\d+)/);
    if (!linkMatch) continue;

    const blogId = linkMatch[1].toLowerCase();
    const postNo = linkMatch[2];
    if (blogId === 'naverpost' || blogId === 'naver' || blogId === 'nblog') continue;

    const key = blogId + '/' + postNo;
    if (seen.has(key)) continue;
    seen.add(key);

    ranked.push({ rank: r, blogId, postNo });
  }

  // r 값 기준 오름차순 정렬 — 네이버가 매긴 실제 노출 순서
  ranked.sort((a, b) => a.rank - b.rank);
  return ranked.map(({ blogId, postNo }) => ({ blogId, postNo }));
}

async function fetchArea(url, useRankedExtraction) {
  try {
    const r = await fetch(url, { headers: COMMON_HEADERS });
    if (!r.ok) return { items: [], error: "응답 오류 " + r.status };
    const html = await r.text();
    let items = useRankedExtraction ? extractRankedBlogLinks(html) : extractBlogLinks(html);
    // ranked 추출이 비정상적으로 비면(파싱 실패) 기존 방식으로 폴백
    if (useRankedExtraction && items.length === 0) {
      items = extractBlogLinks(html);
    }
    return { items, error: null };
  } catch (e) {
    return { items: [], error: e.message || "요청 실패" };
  }
}

function findRank(items, blogId, postNo) {
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    if (postNo) {
      if (item.postNo === postNo) return i + 1;
    } else if (blogId) {
      if (item.blogId === blogId) return i + 1;
    }
  }
  return null;
}

// ── 기존: 통합검색 단일 조회 (하위호환) ──
app.get('/naver-search', async (req, res) => {
  if (req.query.key !== SECRET_KEY) return res.status(403).json({ error: "인증 실패" });
  const { keyword, type } = req.query;
  if (!keyword) return res.status(400).json({ error: "keyword 필요" });

  let url, ranked;
  if (type === 'blog') {
    url = `https://search.naver.com/search.naver?ssc=tab.blog.all&sm=tab_jum&query=${encodeURIComponent(keyword)}`;
    ranked = false;
  } else {
    url = `https://search.naver.com/search.naver?where=nexearch&sm=top_hty&fbm=0&ie=utf8&query=${encodeURIComponent(keyword)}`;
    ranked = true;
  }

  const result = await fetchArea(url, ranked);
  res.json({ success: !result.error, count: result.items.length, items: result.items, error: result.error });
});

// ── 신규: 통합검색 + 블로그탭 2영역 동시 조회 ──
app.get('/naver-search-areas', async (req, res) => {
  if (req.query.key !== SECRET_KEY) return res.status(403).json({ error: "인증 실패" });
  const { keyword, blogId, postNo } = req.query;
  if (!keyword) return res.status(400).json({ error: "keyword 필요" });

  const normBlogId = (blogId || "").toLowerCase().trim();
  const normPostNo = (postNo || "").trim();

  const urls = {
    main_search: `https://search.naver.com/search.naver?where=nexearch&sm=top_hty&fbm=0&ie=utf8&query=${encodeURIComponent(keyword)}`,
    blog: `https://search.naver.com/search.naver?ssc=tab.blog.all&sm=tab_jum&query=${encodeURIComponent(keyword)}`,
  };

  try {
    const [main, blog] = await Promise.all([
      fetchArea(urls.main_search, true),
      fetchArea(urls.blog, false),
    ]);

    const areas = {
      main_search: {
        exposed_area: "통합검색",
        rank: findRank(main.items, normBlogId, normPostNo),
        total: main.items.length,
        error: main.error,
        search_url: urls.main_search,
      },
      blog: {
        exposed_area: "블로그탭",
        rank: findRank(blog.items, normBlogId, normPostNo),
        total: blog.items.length,
        error: blog.error,
        search_url: urls.blog,
      },
    };

    res.json({ success: true, keyword, areas });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

// ── 신규: 블로그탭 "기간 필터" 검색 (누락 재확인용) ──
// 제목을 따옴표로 감싸 검색하면 흔한 제목은 결과가 수백 개라 첫 페이지(30개)에 안 잡힌다.
// 발행일 전후 하루로 기간을 걸면 그날 그 문구로 쓴 글만 남아 첫 페이지에서 찾을 수 있다.
// date = YYYYMMDD (글 발행일)
function shiftYmd(ymd, days) {
  const d = new Date(Date.UTC(+ymd.slice(0, 4), +ymd.slice(4, 6) - 1, +ymd.slice(6, 8)));
  d.setUTCDate(d.getUTCDate() + days);
  return d.getUTCFullYear() + String(d.getUTCMonth() + 1).padStart(2, "0") + String(d.getUTCDate()).padStart(2, "0");
}
app.get('/naver-blog-dated', async (req, res) => {
  if (req.query.key !== SECRET_KEY) return res.status(403).json({ error: "인증 실패" });
  const { keyword, blogId, postNo, date } = req.query;
  if (!keyword || !/^\d{8}$/.test(date || "")) return res.status(400).json({ error: "keyword, date(YYYYMMDD) 필요" });

  const f = shiftYmd(date, -1), t = shiftYmd(date, 1);
  const url = `https://search.naver.com/search.naver?ssc=tab.blog.all&sm=tab_jum&query=${encodeURIComponent(keyword)}`
    + `&nso=so%3Ar%2Cp%3Afrom${f}to${t}&date_from=${f}&date_to=${t}&date_option=8`;

  const result = await fetchArea(url, false);
  const rank = findRank(result.items, (blogId || "").toLowerCase().trim(), (postNo || "").trim());
  res.json({ success: !result.error, rank, total: result.items.length, from: f, to: t, error: result.error, search_url: url });
});

// ── 진단용 /health : 인증 없이 접근 가능 (상태 확인 전용, 민감정보 미노출) ──
app.get('/health', async (req, res) => {
  const uptimeSec = Math.floor((Date.now() - STARTED_AT.getTime()) / 1000);

  // 현재 공인 IP 조회 (실패해도 health 자체는 응답)
  let publicIp = null;
  let ipError = null;
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 4000);
    const r = await fetch('https://api.ipify.org?format=json', { signal: ctrl.signal });
    clearTimeout(t);
    const d = await r.json();
    publicIp = d.ip;
  } catch (e) {
    ipError = e.message || '조회 실패';
  }

  // 네이버 접근 가능 여부 (차단 여부 확인용)
  let naverStatus = null;
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 5000);
    const r = await fetch('https://search.naver.com/search.naver?query=test', {
      headers: COMMON_HEADERS,
      signal: ctrl.signal,
    });
    clearTimeout(t);
    naverStatus = r.status;
  } catch (e) {
    naverStatus = 'error: ' + (e.message || 'unknown');
  }

  res.json({
    status: 'ok',
    startedAt: STARTED_AT.toISOString(),
    uptimeSec,
    port: PORT,
    publicIp,
    ipError,
    naverStatus,
    now: new Date().toISOString(),
  });
});

app.get('/ping', (req, res) => res.json({ status: 'ok', time: new Date().toISOString() }));

const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`[${new Date().toISOString()}] 프록시 서버 실행 중: http://0.0.0.0:${PORT}`);
  console.log(`  상태 확인: http://localhost:${PORT}/health`);
});

// 포트 충돌 등 기동 실패를 조용히 넘기지 않고 명시적으로 출력
server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`[오류] 포트 ${PORT} 가 이미 사용 중입니다. 기존 프로세스를 종료한 뒤 다시 실행하세요.`);
  } else {
    console.error('[오류] 서버 기동 실패:', err.message);
  }
  process.exit(1);
});

process.on('unhandledRejection', (err) => {
  console.error(`[${new Date().toISOString()}] 처리되지 않은 오류:`, err && err.message ? err.message : err);
});
