// pages/api/naver-rank.js
export const config = { maxDuration: 20 };

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
    // sim + date 두 방식 병렬 조회
    const fetchSort = async (sort) => {
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

    const [simResult, dateResult] = await Promise.allSettled([
      fetchSort("sim"),
      fetchSort("date"),
    ]);

    if (simResult.status === "rejected" && dateResult.status === "rejected") {
      return res.status(500).json({ error: "네이버 API 오류" });
    }

    const simItems = simResult.status === "fulfilled" ? (simResult.value.items || []) : [];
    const dateItems = dateResult.status === "fulfilled" ? (dateResult.value.items || []) : [];

    // 두 결과에서 내 글 순위 찾기
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

    // 둘 다 있으면 낮은 순위(더 상위) 채택, 없으면 있는 것 채택
    let myRank = null;
    let rankSource = null;
    if (simRank !== null && dateRank !== null) {
      if (simRank <= dateRank) { myRank = simRank; rankSource = "sim"; }
      else { myRank = dateRank; rankSource = "date"; }
    } else if (simRank !== null) { myRank = simRank; rankSource = "sim"; }
    else if (dateRank !== null) { myRank = dateRank; rankSource = "date"; }

    // items는 sim 기준으로 반환 (UI용)
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

    const debugTop5 = results.slice(0, 5).map(function(r) {
      return {
        rank: r.rank, link: r.link, bloggerlink: r.bloggerlink,
        extractedBlogId: r.extractedBlogId, extractedPostNo: r.extractedPostNo, isMine: r.isMine,
      };
    });

    return res.status(200).json({
      keyword,
      total: simResult.status === "fulfilled" ? (simResult.value.total || 0) : 0,
      display: simItems.length,
      myRank,
      rankSource,
      simRank,
      dateRank,
      searchedBlogId: normalizedBlogId,
      searchedPostNo: normalizedPostNo,
      debugTop5,
      items: results,
    });

  } catch (err) {
    return res.status(500).json({ error: err.message || "서버 오류" });
  }
}
