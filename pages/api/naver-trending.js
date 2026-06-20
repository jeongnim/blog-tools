// pages/api/naver-trending.js
// 네이버 블로그 주제별 실시간 인기글 제목 크롤링
export const config = { maxDuration: 15 };

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  if (req.method === "OPTIONS") return res.status(200).end();

  const { dirNo } = req.query;
  if (!dirNo) return res.status(400).json({ error: "dirNo 파라미터 필요" });

  try {
    const url = `https://section.blog.naver.com/ajax/DirectoryTopPostList.naver?directorySeq=${dirNo}&itemCount=15`;

    const r = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        "Accept": "application/json, text/plain, */*",
        "Accept-Language": "ko-KR,ko;q=0.9",
        "Referer": "https://section.blog.naver.com/",
      },
      signal: AbortSignal.timeout(10000),
    });

    if (!r.ok) return res.status(200).json({ titles: [], error: `네이버 응답 오류 ${r.status}` });

    const text = await r.text();

    // 네이버 AJAX 응답은 앞에 )]}', 같은 prefix가 붙을 수 있음
    const jsonStart = text.indexOf("{");
    if (jsonStart === -1) return res.status(200).json({ titles: [], error: "JSON 파싱 실패" });

    const data = JSON.parse(text.slice(jsonStart));
    const items = data?.result || [];

    const titles = items
      .map(item => (item.title || "").replace(/&#?\w+;/g, "").replace(/<[^>]+>/g, "").trim())
      .filter(t => t.length >= 5)
      .slice(0, 15);

    res.status(200).json({ titles, count: titles.length });
  } catch (err) {
    res.status(200).json({ titles: [], error: err.message });
  }
}
