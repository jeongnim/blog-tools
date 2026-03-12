// pages/api/naver-rank.js
export const config = { maxDuration: 15 };

function extractBlogInfo(url) {
  if (!url) return { blogId: "", postNo: "" };

  // 패턴 1: blog.naver.com/아이디/포스트번호
  var m = url.match(/blog\.naver\.com\/([^/?#&]+)\/(\d+)/);
  if (m) return { blogId: m[1].toLowerCase(), postNo: m[2] };

  // 패턴 2: m.blog.naver.com/아이디/포스트번호
  m = url.match(/m\.blog\.naver\.com\/([^/?#&]+)\/(\d+)/);
  if (m) return { blogId: m[1].toLowerCase(), postNo: m[2] };

  // 패턴 3: blogId=xxx&logNo=yyy
  var blogIdQ = url.match(/[?&]blogId=([^&]+)/);
  var logNoQ  = url.match(/[?&]logNo=(\d+)/);
  if (blogIdQ) return { blogId: blogIdQ[1].toLowerCase(), postNo: logNoQ ? logNoQ[1] : "" };

  // 패턴 4: blog.naver.com/아이디
  m = url.match(/blog\.naver\.com\/([^/?#&]+)/);
  if (m) return { blogId: m[1].toLowerCase(), postNo: "" };

  return { blogId: "", postNo: "" };
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS");
  if (req.method === "OPTIONS") return res.status(200).end();

  const { keyword, blogId, postNo } = req.query;

  if (!keyword) {
    return res.status(400).json({ error: "keyword 파라미터가 필요합니다." });
  }

  const clientId     = process.env.NAVER_CLIENT_ID;
  const clientSecret = process.env.NAVER_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    return res.status(500).json({ error: "네이버 API 키가 설정되지 않았습니다." });
  }

  const normalizedBlogId = (blogId || "").toLowerCase().trim();
  const normalizedPostNo = (postNo || "").trim();

  try {
    const apiUrl = "https://openapi.naver.com/v1/search/blog.json?query=" + encodeURIComponent(keyword) + "&display=100&start=1&sort=sim";

    const controller = new AbortController();
    const timer = setTimeout(function() { controller.abort(); }, 10000);

    const response = await fetch(apiUrl, {
      headers: {
        "X-Naver-Client-Id": clientId,
        "X-Naver-Client-Secret": clientSecret,
      },
      signal: controller.signal,
    });
    clearTimeout(timer);

    if (!response.ok) {
      const errText = await response.text();
      return res.status(response.status).json({ error: "네이버 API 오류: " + response.status, detail: errText });
    }

    const data = await response.json();
    const items = data.items || [];

    let myRank = null;

    const results = items.map(function(item, index) {
      const rank = index + 1;

      const fromLink    = extractBlogInfo(item.link || "");
      const fromBlogger = extractBlogInfo(item.bloggerlink || "");

      let isMine = false;

      // postNo 우선 매칭
      if (normalizedPostNo) {
        if (fromLink.postNo === normalizedPostNo || fromBlogger.postNo === normalizedPostNo) {
          isMine = true;
        }
      }

      // postNo 없으면 blogId로 매칭
      if (!isMine && normalizedBlogId && !normalizedPostNo) {
        if (fromLink.blogId === normalizedBlogId || fromBlogger.blogId === normalizedBlogId) {
          isMine = true;
        }
      }

      if (isMine && myRank === null) myRank = rank;

      const cleanTitle = (item.title || "").replace(/<[^>]+>/g, "");

      return {
        rank: rank,
        title: cleanTitle,
        link: item.link || "",
        bloggerlink: item.bloggerlink || "",
        bloggerName: item.bloggername || "",
        postDate: item.postdate || "",
        extractedBlogId: fromLink.blogId || fromBlogger.blogId,
        extractedPostNo: fromLink.postNo || fromBlogger.postNo,
        isMine: isMine,
      };
    });

    // 디버그: 상위 5개 링크 정보 (매칭 확인용)
    const debugTop5 = results.slice(0, 5).map(function(r) {
      return {
        rank: r.rank,
        link: r.link,
        bloggerlink: r.bloggerlink,
        extractedBlogId: r.extractedBlogId,
        extractedPostNo: r.extractedPostNo,
        isMine: r.isMine,
      };
    });

    return res.status(200).json({
      keyword: keyword,
      total: data.total || 0,
      display: items.length,
      myRank: myRank,
      searchedBlogId: normalizedBlogId,
      searchedPostNo: normalizedPostNo,
      debugTop5: debugTop5,
      items: results,
    });

  } catch (err) {
    return res.status(500).json({ error: err.message || "서버 오류" });
  }
}
