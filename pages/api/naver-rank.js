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

// ── 홈 PC 프록시를 통한 실제 네이버 통합검색 크롤링 ──
async function fetchViaHomeProxy(keyword, normalizedBlogId, normalizedPostNo) {
  const proxyUrl = process.env.HOME_PROXY_URL;
  const proxyKey = process.env.HOME_PROXY_KEY;
  if (!proxyUrl || !proxyKey) return { rank: null, error: "프록시 미설정", items: [] };

  try {
    const url = `${proxyUrl}/naver-search?keyword=${encodeURIComponent(keyword)}&key=${encodeURIComponent(proxyKey)}`;
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 15000);
    const r = await fetch(url, { signal: ctrl.signal });
    clearTimeout(t);

    if (!r.ok) return { rank: null, error: "프록시 응답 오류 " + r.status, items: [] };

    const data = await r.json();
    if (!data.success) return { rank: null, error: data.error || "프록시 실패", items: [] };

    const items = data.items || [];
    let rank = null;
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (normalizedPostNo) {
        if (item.postNo === normalizedPostNo) { rank = i + 1; break; }
      } else if (normalizedBlogId) {
        if (item.blogId === normalizedBlogId) { rank = i + 1; break; }
      }
    }
    return { rank, error: null, items, total: items.length };
  } catch (e) {
    return { rank: null, error: e.message || "프록시 연결 실패", items: [] };
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

  const normalizedBlogId = (blogId || "").toLowerCase().trim();
  const normalizedPostNo = (postNo || "").trim();

  try {
    // ── 홈 프록시(실제 검색) + Search API(sim/date) 병렬 조회 ──
    const tasks = [fetchViaHomeProxy(keyword, normalizedBlogId, normalizedPostNo)];

    const fetchSort = async (sort) => {
      if (!clientId || !clientSecret) return null;
      const url = "https://openapi.naver.com/v1/search/blog.json?query=" + encodeURIComponent(keyword) + "&display=100&start=1&sort=" + sort;
      const ctrl = new AbortController();
      const t = setTimeout(() => ctrl.abort(), 10000);
      const r = await fetch(url, {
        headers: { "X-Naver-Client-Id": clientId, "X-Naver-Client-Secret": clientSecret },
        signal: ctrl.signal,
      });
      clearTimeout(t);
      if (!r.ok) throw new Error("API 오류 " + r.status);
      return await r.json();
    };

    const [proxyResult, simResult, dateResult] = await Promise.allSettled([
      tasks[0],
      fetchSort("sim"),
      fetchSort("date"),
    ]);

    const proxy = proxyResult.status === "fulfilled" ? proxyResult.value : { rank: null, error: proxyResult.reason?.message, items: [] };

    const simItems = (simResult.status === "fulfilled" && simResult.value) ? (simResult.value.items || []) : [];
    const dateItems = (dateResult.status === "fulfilled" && dateResult.value) ? (dateResult.value.items || []) : [];

    const findMyRank = (items) => {
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        const fromLink    = extractBlogInfo(item.link || "");
        const fromBlogger = extractBlogInfo(item.bloggerlink || "");
        if (normalizedPostNo) {
          if (fromLink.postNo === normalizedPostNo || fromBlogger.postNo === normalizedPostNo) return i + 1;
        } else if (normalizedBlogId) {
          if (fromLink.blogId === normalizedBlogId || fromBlogger.blogId === normalizedBlogId) return i + 1;
        }
      }
      return null;
    };

    const simRank  = findMyRank(simItems);
    const dateRank = findMyRank(dateItems);
    const proxyRank = proxy.rank;

    // 우선순위: 홈프록시(실제검색) > sim/date 중 더 좋은 순위
    let myRank = null;
    let rankSource = null;
    if (proxyRank !== null) {
      myRank = proxyRank; rankSource = "live";
    } else if (simRank !== null && dateRank !== null) {
      if (simRank <= dateRank) { myRank = simRank; rankSource = "sim"; }
      else { myRank = dateRank; rankSource = "date"; }
    } else if (simRank !== null) { myRank = simRank; rankSource = "sim"; }
    else if (dateRank !== null) { myRank = dateRank; rankSource = "date"; }

    // items는 sim 기준으로 반환 (UI 디버그용)
    const results = simItems.map(function(item, index) {
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
      return {
        rank, title: (item.title || "").replace(/<[^>]+>/g, ""),
        link: item.link || "", bloggerlink: item.bloggerlink || "",
        bloggerName: item.bloggername || "", postDate: item.postdate || "",
        extractedBlogId: fromLink.blogId || fromBlogger.blogId,
        extractedPostNo: fromLink.postNo || fromBlogger.postNo,
        isMine,
      };
    });

    return res.status(200).json({
      keyword,
      total: simResult.status === "fulfilled" && simResult.value ? (simResult.value.total || 0) : 0,
      display: simItems.length,
      myRank,
      rankSource,       // "live"(홈프록시 실제검색) | "sim" | "date" | null
      proxyRank,
      proxyError: proxy.error,
      proxyTotal: proxy.total ?? null,
      simRank,
      dateRank,
      searchedBlogId: normalizedBlogId,
      searchedPostNo: normalizedPostNo,
      items: results,
    });

  } catch (err) {
    return res.status(500).json({ error: err.message || "서버 오류" });
  }
}
