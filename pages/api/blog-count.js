// pages/api/blog-count.js
// 네이버 Search API로 블로그 총 게시물 수 조회
export const config = { maxDuration: 30 };

export default async function handler(req, res) {
  const { keyword } = req.query;
  if (!keyword) return res.status(400).json({ error: "keyword 필요" });

  const clientId = process.env.NAVER_CLIENT_ID;
  const clientSecret = process.env.NAVER_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    return res.status(200).json({ total: null, error: "NAVER_CLIENT_ID/SECRET 없음" });
  }

  try {
    const url = `https://openapi.naver.com/v1/search/blog.json?query=${encodeURIComponent(keyword)}&display=1&start=1&sort=sim`;
    const response = await fetch(url, {
      headers: {
        "X-Naver-Client-Id": clientId,
        "X-Naver-Client-Secret": clientSecret,
      },
    });
    const data = await response.json();
    if (data.errorCode) return res.status(200).json({ total: null, error: data.errorMessage });
    res.status(200).json({ total: data.total || 0 });
  } catch (err) {
    res.status(200).json({ total: null, error: err.message });
  }
}
