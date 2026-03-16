// pages/api/blog-content.js
// 네이버 블로그 상위 3개 본문 크롤링 → 어휘 스타일 추출
export const config = { maxDuration: 45 };

// 블로그 URL → 본문 텍스트 추출
async function fetchBlogBody(url) {
  try {
    // blog.naver.com/userid/postid 형식 → PostView.naver로 변환
    let fetchUrl = url;
    const m = url.match(/blog\.naver\.com\/([^/]+)\/(\d+)/);
    if (m) {
      fetchUrl = `https://blog.naver.com/PostView.naver?blogId=${m[1]}&logNo=${m[2]}&redirect=Dlog&widgetTypeCall=true`;
    }

    const r = await fetch(fetchUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml",
        "Accept-Language": "ko-KR,ko;q=0.9",
        "Referer": "https://search.naver.com/",
      },
      signal: AbortSignal.timeout(8000),
    });

    if (!r.ok) return null;
    const html = await r.text();

    // 본문 추출 시도 (여러 패턴)
    let text = "";

    // 패턴 1: se-main-container (스마트에디터 ONE)
    const m1 = html.match(/<div[^>]*class="[^"]*se-main-container[^"]*"[^>]*>([\s\S]*?)<\/div>\s*<\/div>\s*<\/div>/);
    if (m1) text = m1[1];

    // 패턴 2: postViewArea
    if (!text) {
      const m2 = html.match(/<div[^>]*id="postViewArea"[^>]*>([\s\S]*?)<\/div>/);
      if (m2) text = m2[1];
    }

    // 패턴 3: post-view
    if (!text) {
      const m3 = html.match(/<div[^>]*class="[^"]*post-view[^"]*"[^>]*>([\s\S]*?)<\/div>/);
      if (m3) text = m3[1];
    }

    // 패턴 4: 전체 body에서 태그 제거
    if (!text) text = html;

    // HTML 태그 제거 + 공백 정리
    text = text
      .replace(/<script[\s\S]*?<\/script>/gi, "")
      .replace(/<style[\s\S]*?<\/style>/gi, "")
      .replace(/<[^>]+>/g, " ")
      .replace(/&nbsp;/g, " ")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&amp;/g, "&")
      .replace(/\s+/g, " ")
      .trim();

    // 최소 200자 이상이어야 유효
    if (text.length < 200) return null;

    // 최대 5000자 반환 (SEO 글자수 계산 정확도 향상)
    return text.slice(0, 5000);
  } catch (e) {
    return null;
  }
}

export default async function handler(req, res) {
  const { keyword, url } = req.query;

  // ── url 파라미터: 특정 블로그 글 본문 직접 크롤링 ──
  if (url) {
    try {
      const body = await fetchBlogBody(decodeURIComponent(url));
      if (body) {
        return res.status(200).json({ success: true, bodies: [body] });
      } else {
        return res.status(200).json({ success: false, bodies: [], error: "본문 추출 실패" });
      }
    } catch (err) {
      return res.status(200).json({ success: false, bodies: [], error: err.message });
    }
  }

  if (!keyword) return res.status(400).json({ error: "keyword 또는 url 필요" });

  const clientId     = process.env.NAVER_CLIENT_ID;
  const clientSecret = process.env.NAVER_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    return res.status(200).json({ bodies: [], success: false, error: "API 키 없음" });
  }

  try {
    // 1. 네이버 Search API로 상위 5개 URL 가져오기
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
    if (data.errorCode) return res.status(200).json({ bodies: [], success: false, error: data.errorMessage });

    const items = (data.items || []).slice(0, 5);
    const links = items.map(i => i.link || i.bloggerlink).filter(Boolean);

    if (links.length === 0) {
      return res.status(200).json({ bodies: [], success: false, error: "URL 없음" });
    }

    // 2. 상위 3개 본문 크롤링 (병렬)
    const results = await Promise.all(links.slice(0, 3).map(url => fetchBlogBody(url)));
    const bodies  = results.filter(Boolean);

    res.status(200).json({
      success: bodies.length > 0,
      count: bodies.length,
      bodies,
    });
  } catch (err) {
    res.status(200).json({ bodies: [], success: false, error: err.message });
  }
}
