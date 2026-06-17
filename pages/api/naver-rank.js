// pages/api/naver-rank.js
export const config = { maxDuration: 25 };

function extractBlogInfo(url) {
  if (!url) return { blogId: "", postNo: "" };
  var m = url.match(/blog\.naver\.com\/([^/?#&]+)\/(\d+)/);
  if (m) return { blogId: m[1].toLowerCase(), postNo: m[2] };
  m = url.match(/m\.blog\.naver\.com\/([^/?#&]+)\/(\d+)/);
  if (m) return { blogId: m[1].toLowerCase(), postNo: m[2] };
  var blogIdQ = url.match(/[?&]blogId=([^&]+)/);
  var logNoQ  = url.match(/[?&]logNo=(\d+)/);
  if (blogIdQ) return { blogId: blogIdQ[1].toLowerCase(), postNo: logNoQ ? logNoQ[1] : "" };
  m = url.match(/blog\.naver\.com\/([^/?#&]+)/);
  if (m) return { blogId: m[1].toLowerCase(), postNo: "" };
  return { blogId: "", postNo: "" };
}

// ── 크롤링 방식: search.naver.com 통합검색(nexearch) 직접 조회 ──
async function crawlNaverRank(keyword, normalizedBlogId, normalizedPostNo) {
  try {
    // where=nexearch: 실제 사람이 보는 통합검색 (스마트블록 포함)
    const searchUrl = "https://search.naver.com/search.naver?where=nexearch&sm=top_hty&fbm=0&ie=utf8&query=" + encodeURIComponent(keyword);
    const r = await fetch(searchUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
        "Accept-Language": "ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7",
        "Accept-Encoding": "gzip, deflate, br",
        "Referer": "https://www.naver.com/",
        "Cache-Control": "no-cache",
        "Sec-Fetch-Dest": "document",
        "Sec-Fetch-Mode": "navigate",
        "Sec-Fetch-Site": "same-origin",
      },
      signal: AbortSignal.timeout(10000),
      redirect: "follow",
    });
    if (!r.ok) return { crawlRank: null, crawlError: "응답 오류 " + r.status };

    const html = await r.text();

    // 봇 차단 감지
    if (html.length < 5000 || html.includes("차단") || html.includes("blocked") || html.includes("captcha")) {
      return { crawlRank: null, crawlError: "봇 차단 감지" };
    }

    // 스마트블록 내 블로그 링크 추출
    // 네이버 통합검색 HTML에서 blog.naver.com 링크만 순서대로 추출
    // href="https://blog.naver.com/아이디/포스트번호" 패턴
    const linkPattern = /href=["']https?:\/\/(?:m\.)?blog\.naver\.com\/([^/"'\s?#&]+)\/(\d+)["']/g;
    const found = [];
    let match;
    const seen = new Set();
    while ((match = linkPattern.exec(html)) !== null) {
      const blogId = match[1].toLowerCase();
      const postNo = match[2];
      // 네이버 내부 시스템 계정 제외
      if (blogId === "naverpost" || blogId === "naver" || blogId === "nblog") continue;
      const key = blogId + "/" + postNo;
      if (!seen.has(key)) {
        seen.add(key);
        found.push({ blogId, postNo });
      }
    }

    // href 패턴으로 못 찾으면 일반 URL 패턴으로 fallback
    if (found.length === 0) {
      const fallbackPattern = /blog\.naver\.com\/([^/"'\s?#&]+)\/(\d+)/g;
      while ((match = fallbackPattern.exec(html)) !== null) {
        const blogId = match[1].toLowerCase();
        const postNo = match[2];
        if (blogId === "naverpost" || blogId === "naver" || blogId === "nblog") continue;
        const key = blogId + "/" + postNo;
        if (!seen.has(key)) {
          seen.add(key);
          found.push({ blogId, postNo });
        }
      }
    }

    if (found.length === 0) return { crawlRank: null, crawlError: "검색 결과 없음 또는 봇 차단" };

    let crawlRank = null;
    for (let i = 0; i < found.length; i++) {
      const item = found[i];
      if (normalizedPostNo) {
        if (item.postNo === normalizedPostNo) { crawlRank = i + 1; break; }
      } else if (normalizedBlogId) {
        if (item.blogId === normalizedBlogId) { crawlRank = i + 1; break; }
      }
    }

    return { crawlRank, crawlError: null, crawlTotal: found.length };
  } catch (e) {
    return { crawlRank: null, crawlError: e.message || "크롤링 실패" };
  }
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS");
  if (req.method === "OPTIONS") return res.status(200).end();

  const { keyword, blogId, postNo } = req.query;
  if (!keyword) return res.status(400).json({ error: "keyword 파라미터가 필요합니다." });

  const clientId     = process.env.NAVER_CLIENT_ID;
  const clientSecret = process.env.NAVER_CLIENT_SECRET;
  if (!clientId || !clientSecret) return res.status(500).json({ error: "네이버 API 키가 설정되지 않았습니다." });

  const normalizedBlogId = (blogId || "").toLowerCase().trim();
  const normalizedPostNo = (postNo || "").trim();

  try {
    // ── 두 방식 병렬 조회 ──
    const [apiResult, crawlResult] = await Promise.allSettled([
      // 1) 기존 Search API 방식
      (async () => {
        const apiUrl = "https://openapi.naver.com/v1/search/blog.json?query=" + encodeURIComponent(keyword) + "&display=100&start=1&sort=sim";
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 10000);
        const response = await fetch(apiUrl, {
          headers: { "X-Naver-Client-Id": clientId, "X-Naver-Client-Secret": clientSecret },
          signal: controller.signal,
        });
        clearTimeout(timer);
        if (!response.ok) throw new Error("API 오류 " + response.status);
        return await response.json();
      })(),
      // 2) 크롤링 방식
      crawlNaverRank(keyword, normalizedBlogId, normalizedPostNo),
    ]);

    // ── API 결과 처리 ──
    let myRank = null;
    let items = [];
    let apiError = null;

    if (apiResult.status === "fulfilled") {
      const data = apiResult.value;
      if (data.errorCode) {
        apiError = data.errorMessage;
      } else {
        items = (data.items || []).map(function(item, index) {
          const rank = index + 1;
          const fromLink    = extractBlogInfo(item.link || "");
          const fromBlogger = extractBlogInfo(item.bloggerlink || "");
          let isMine = false;
          if (normalizedPostNo) {
            if (fromLink.postNo === normalizedPostNo || fromBlogger.postNo === normalizedPostNo) isMine = true;
          }
          if (!isMine && normalizedBlogId && !normalizedPostNo) {
            if (fromLink.blogId === normalizedBlogId || fromBlogger.blogId === normalizedBlogId) isMine = true;
          }
          if (isMine && myRank === null) myRank = rank;
          return {
            rank, title: (item.title || "").replace(/<[^>]+>/g, ""),
            link: item.link || "", bloggerlink: item.bloggerlink || "",
            bloggerName: item.bloggername || "", postDate: item.postdate || "",
            extractedBlogId: fromLink.blogId || fromBlogger.blogId,
            extractedPostNo: fromLink.postNo || fromBlogger.postNo,
            isMine,
          };
        });
      }
    } else {
      apiError = apiResult.reason?.message || "API 조회 실패";
    }

    // ── 크롤링 결과 처리 ──
    const crawl = crawlResult.status === "fulfilled" ? crawlResult.value : { crawlRank: null, crawlError: crawlResult.reason?.message };

    const debugTop5 = items.slice(0, 5).map(r => ({
      rank: r.rank, link: r.link, bloggerlink: r.bloggerlink,
      extractedBlogId: r.extractedBlogId, extractedPostNo: r.extractedPostNo, isMine: r.isMine,
    }));

    return res.status(200).json({
      keyword,
      total: apiResult.status === "fulfilled" ? (apiResult.value.total || 0) : 0,
      display: items.length,
      // 기존 API 결과
      myRank,
      apiError,
      // 크롤링 결과
      crawlRank: crawl.crawlRank ?? null,
      crawlError: crawl.crawlError ?? null,
      crawlTotal: crawl.crawlTotal ?? null,
      // 기타
      searchedBlogId: normalizedBlogId,
      searchedPostNo: normalizedPostNo,
      debugTop5,
      items,
    });

  } catch (err) {
    return res.status(500).json({ error: err.message || "서버 오류" });
  }
}
