// pages/api/blog-titles.js
// 네이버 Search API로 상위 블로그 글 제목 + URL 반환
export const config = { maxDuration: 30 };

export default async function handler(req, res) {
  const { keyword } = req.query;
  if (!keyword) return res.status(400).json({ error: "keyword 필요" });

  const clientId     = process.env.NAVER_CLIENT_ID;
  const clientSecret = process.env.NAVER_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    return res.status(200).json({ titles: [], links: [], error: "NAVER_CLIENT_ID/SECRET 없음" });
  }

  try {
    const r = await fetch(
      `https://openapi.naver.com/v1/search/blog.json?query=${encodeURIComponent(keyword)}&display=5&start=1&sort=sim`,
      {
        headers: {
          "X-Naver-Client-Id": clientId,
          "X-Naver-Client-Secret": clientSecret,
        },
      }
    );
    const data = await r.json();
    if (data.errorCode) return res.status(200).json({ titles: [], links: [], error: data.errorMessage });

    const items = (data.items || []).slice(0, 5);
    const titles = items.map(i => i.title.replace(/<[^>]+>/g, ""));
    const links  = items.map(i => i.link || i.bloggerlink);

    res.status(200).json({ titles, links });
  } catch (err) {
    res.status(200).json({ titles: [], links: [], error: err.message });
  }
}
