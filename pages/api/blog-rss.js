// pages/api/blog-rss.js
// 네이버 블로그 RSS를 서버에서 fetch → CORS 우회
export const config = { maxDuration: 15 };

export default async function handler(req, res) {
  const { blogId } = req.query;
  if (!blogId) return res.status(400).json({ error: "blogId 파라미터가 필요합니다." });

  const rssUrl = `https://rss.blog.naver.com/${blogId.trim()}`;

  try {
    const response = await fetch(rssUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        "Accept": "application/rss+xml, application/xml, text/xml, */*",
        "Accept-Language": "ko-KR,ko;q=0.9",
      },
      signal: AbortSignal.timeout(12000),
    });

    if (!response.ok) {
      return res.status(response.status).json({ error: `RSS 응답 오류 (${response.status}). 블로그 아이디를 확인해주세요.` });
    }

    const xml = await response.text();

    if (!xml.includes("<item")) {
      return res.status(404).json({ error: "게시글을 찾을 수 없어요. 블로그 아이디를 다시 확인해주세요." });
    }

    // XML 그대로 반환
    res.setHeader("Content-Type", "application/xml; charset=utf-8");
    res.status(200).send(xml);

  } catch (err) {
    if (err.name === "AbortError" || err.name === "TimeoutError") {
      return res.status(408).json({ error: "요청 시간 초과. 다시 시도해주세요." });
    }
    return res.status(500).json({ error: err.message || "서버 오류가 발생했습니다." });
  }
}
