// pages/api/naver-rank.js
// 네이버 검색 Open API - 블로그탭 순위 조회
// 키워드로 블로그 검색 결과 최대 100개를 가져와서
// 특정 블로그 ID(postNo)가 몇 위인지 반환

export default async function handler(req, res) {
  // CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS");
  if (req.method === "OPTIONS") return res.status(200).end();

  const { keyword, blogId, postNo } = req.query;

  if (!keyword) {
    return res.status(400).json({ error: "keyword 파라미터가 필요합니다." });
  }

  const clientId = process.env.NAVER_CLIENT_ID;
  const clientSecret = process.env.NAVER_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    return res.status(500).json({ error: "네이버 API 키가 설정되지 않았습니다." });
  }

  try {
    // 네이버 블로그 검색 API - 최대 100개 (1회 호출로 상위 100위 전부 확인)
    const query = encodeURIComponent(keyword);
    const apiUrl = `https://openapi.naver.com/v1/search/blog.json?query=${query}&display=100&start=1&sort=sim`;

    const response = await fetch(apiUrl, {
      headers: {
        "X-Naver-Client-Id": clientId,
        "X-Naver-Client-Secret": clientSecret,
      },
    });

    if (!response.ok) {
      const errText = await response.text();
      return res.status(response.status).json({ error: `네이버 API 오류: ${response.status}`, detail: errText });
    }

    const data = await response.json();
    const items = data.items || [];

    // 결과 목록 구성
    const results = items.map((item, index) => {
      // 블로그 링크에서 blogId 추출
      // blog.naver.com/아이디/포스트번호 형태
      const link = item.link || "";
      const bloggerLink = item.bloggerlink || "";

      const blogIdMatch = link.match(/blog\.naver\.com\/([^/?#]+)/i)
        || bloggerLink.match(/blog\.naver\.com\/([^/?#]+)/i);
      const postNoMatch = link.match(/\/(\d+)(?:\?|$)/);

      const extractedBlogId = blogIdMatch?.[1]?.toLowerCase() || "";
      const extractedPostNo = postNoMatch?.[1] || "";

      // 제목에서 HTML 태그 제거
      const cleanTitle = (item.title || "").replace(/<[^>]+>/g, "");
      const cleanDesc = (item.description || "").replace(/<[^>]+>/g, "");

      return {
        rank: index + 1,
        title: cleanTitle,
        description: cleanDesc,
        link: item.link || "",
        bloggerName: item.bloggername || "",
        bloggerLink: item.bloggerlink || "",
        postDate: item.postdate || "",
        extractedBlogId,
        extractedPostNo,
        isMine: false, // 아래에서 판별
      };
    });

    // 내 글 여부 판별
    // blogId(블로그 아이디) 또는 postNo(포스트 번호) 로 매칭
    const normalizedBlogId = (blogId || "").toLowerCase().trim();
    const normalizedPostNo = (postNo || "").trim();

    let myRank = null;
    const resultsWithMine = results.map((item) => {
      let isMine = false;

      if (normalizedPostNo && item.extractedPostNo === normalizedPostNo) {
        isMine = true;
      } else if (
        normalizedBlogId &&
        item.extractedBlogId === normalizedBlogId
      ) {
        // blogId만으로 매칭 시 같은 블로그의 다른 글일 수 있으므로
        // postNo가 없을 때만 사용
        if (!normalizedPostNo) isMine = true;
      }

      if (isMine && myRank === null) myRank = item.rank;
      return { ...item, isMine };
    });

    return res.status(200).json({
      keyword,
      total: data.total || 0,
      display: items.length,
      myRank,           // null이면 100위 밖
      items: resultsWithMine,
    });
  } catch (err) {
    return res.status(500).json({ error: err.message || "서버 오류" });
  }
}
