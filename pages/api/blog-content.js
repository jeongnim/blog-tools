// pages/api/blog-content.js
export const config = { maxDuration: 45 };

// 블로그 URL → 본문 텍스트 추출 (모바일 우선)
async function fetchBlogBody(url) {
  try {
    const m = url.match(/blog\.naver\.com\/([^/?\s#]+)\/(\d+)/);
    const blogId = m?.[1];
    const logNo  = m?.[2];

    // 시도 순서: 모바일 → PostView → 원본
    const candidates = [];
    if (blogId && logNo) {
      candidates.push(`https://m.blog.naver.com/${blogId}/${logNo}`);
      candidates.push(`https://blog.naver.com/PostView.naver?blogId=${blogId}&logNo=${logNo}&redirect=Dlog&widgetTypeCall=true`);
    }
    if (!candidates.includes(url)) candidates.push(url);

    for (const fetchUrl of candidates) {
      try {
        const r = await fetch(fetchUrl, {
          headers: {
            "User-Agent": "Mozilla/5.0 (Linux; Android 12; SM-G998B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Mobile Safari/537.36",
            "Accept": "text/html,application/xhtml+xml,*/*",
            "Accept-Language": "ko-KR,ko;q=0.9",
            "Referer": "https://m.blog.naver.com/",
          },
          signal: AbortSignal.timeout(8000),
        });
        if (!r.ok) continue;
        const html = await r.text();

        let text = "";

        // 패턴1: se-main-container (스마트에디터 ONE)
        const m1 = html.match(/class="se-main-container"[^>]*>([\s\S]+?)(?=<\/div>\s*<\/section|<footer|id="footer)/i);
        if (m1) text = m1[1];

        // 패턴2: __entry_content (모바일 블로그)
        if (!text || text.length < 100) {
          const m2 = html.match(/class="[^"]*(?:__entry[_-]content|entry[_-]content)[^"]*"[^>]*>([\s\S]+?)<\/div>/i);
          if (m2) text = m2[1];
        }

        // 패턴3: post-view
        if (!text || text.length < 100) {
          const m3 = html.match(/class="[^"]*post[-_]view[^"]*"[^>]*>([\s\S]+?)<\/div>\s*(?:<div|<\/article)/i);
          if (m3) text = m3[1];
        }

        // 패턴4: postViewArea (구형)
        if (!text || text.length < 100) {
          const m4 = html.match(/id="postViewArea"[^>]*>([\s\S]+?)<\/div>/i);
          if (m4) text = m4[1];
        }

        // 패턴5: article 또는 main 태그
        if (!text || text.length < 100) {
          const m5 = html.match(/<(?:main|article)[^>]*>([\s\S]+?)<\/(?:main|article)>/i);
          if (m5) text = m5[1];
        }

        if (!text || text.length < 100) continue;

        const clean = text
          .replace(/<script[\s\S]*?<\/script>/gi, "")
          .replace(/<style[\s\S]*?<\/style>/gi, "")
          .replace(/<br\s*\/?>/gi, "\n")
          .replace(/<\/p>/gi, "\n")
          .replace(/<\/div>/gi, "\n")
          .replace(/<[^>]+>/g, " ")
          .replace(/&nbsp;/g, " ")
          .replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&")
          .replace(/[ \t]{2,}/g, " ")
          .replace(/\n{3,}/g, "\n\n")
          .trim();

        if (clean.length >= 200) return clean.slice(0, 5000);
      } catch(e) { continue; }
    }
    return null;
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

    const results = await Promise.all(links.slice(0, 3).map(url => fetchBlogBody(url)));
    const bodies  = results.filter(Boolean);

    res.status(200).json({ success: bodies.length > 0, count: bodies.length, bodies });
  } catch (err) {
    res.status(200).json({ bodies: [], success: false, error: err.message });
  }
}
