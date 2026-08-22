// pages/api/blog-posts.js
// 네이버 블로그 전체 글 목록을 페이지 단위로 조회 (RSS와 달리 과거 글까지 접근 가능)
// PostTitleListAsync 엔드포인트 사용 → 실패 시 RSS로 fallback (1페이지 한정)
import { requireAuth } from "../../lib/auth";

export const config = { maxDuration: 20 };

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";

// PostTitleListAsync의 title은 URL 인코딩(+ 는 공백)되어 내려옴
function decodeTitle(s = "") {
  const t = String(s).replace(/\+/g, " ");
  try {
    return decodeURIComponent(t).trim();
  } catch (e) {
    return t.trim();
  }
}

// "2026. 8. 5." → "2026.08.05"  /  시간만 오면 그대로 반환
function normalizeDate(s = "") {
  const m = String(s).match(/(\d{4})\.\s*(\d{1,2})\.\s*(\d{1,2})/);
  if (m) return `${m[1]}.${String(m[2]).padStart(2, "0")}.${String(m[3]).padStart(2, "0")}`;
  return String(s).trim();
}

function parsePostList(raw) {
  let data = null;
  try {
    const s = raw.indexOf("{");
    const e = raw.lastIndexOf("}");
    if (s !== -1 && e !== -1) data = JSON.parse(raw.slice(s, e + 1));
  } catch (e) {
    data = null;
  }

  if (data && Array.isArray(data.postList)) {
    return {
      list: data.postList.map((p) => ({
        postNo: String(p.logNo || "").trim(),
        title: decodeTitle(p.title || ""),
        date: normalizeDate(p.addDate || ""),
      })),
      totalCount: parseInt(data.totalCount, 10) || null,
    };
  }

  // JSON 파싱 실패 시 정규식 fallback
  const list = [];
  const objRe = /\{[^{}]*"logNo"[^{}]*\}/g;
  let m;
  while ((m = objRe.exec(raw)) !== null) {
    const chunk = m[0];
    const logNo = chunk.match(/"logNo"\s*:\s*"?(\d+)"?/)?.[1];
    if (!logNo) continue;
    list.push({
      postNo: logNo,
      title: decodeTitle(chunk.match(/"title"\s*:\s*"([^"]*)"/)?.[1] || ""),
      date: normalizeDate(chunk.match(/"addDate"\s*:\s*"([^"]*)"/)?.[1] || ""),
    });
  }
  const totalCount = parseInt(raw.match(/"totalCount"\s*:\s*"?(\d+)"?/)?.[1], 10) || null;
  return { list, totalCount };
}

// ── fallback: RSS (최근 글만, 1페이지 용도) ──
async function fetchViaRss(blogId, size) {
  const r = await fetch(`https://rss.blog.naver.com/${blogId}`, {
    headers: {
      "User-Agent": UA,
      Accept: "application/rss+xml, application/xml, text/xml, */*",
      "Accept-Language": "ko-KR,ko;q=0.9",
    },
    signal: AbortSignal.timeout(10000),
  });
  if (!r.ok) return null;
  const xml = await r.text();
  if (!xml.includes("<item")) return null;

  const items = xml.split(/<item[\s>]/i).slice(1);
  const list = items
    .map((chunk) => {
      const title = (chunk.match(/<title>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/title>/i)?.[1] || "").trim();
      const link = (chunk.match(/<link>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/link>/i)?.[1] || "").trim();
      const pub = (chunk.match(/<pubDate>([\s\S]*?)<\/pubDate>/i)?.[1] || "").trim();
      const postNo = link.match(/\/(\d+)(?:[?#].*)?$/)?.[1] || "";
      let date = "";
      try {
        if (pub) {
          const d = new Date(pub);
          date = `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")}`;
        }
      } catch (e) {}
      return { postNo, title: title || "(제목 없음)", date };
    })
    .filter((p) => p.postNo);

  return { list: list.slice(0, size), totalCount: list.length };
}

export default async function handler(req, res) {

  res.setHeader("Access-Control-Allow-Origin", "*");
  if (req.method === "OPTIONS") return res.status(200).end();

  if (!requireAuth(req, res)) return;

  const rawId = (req.query.blogId || "").trim();
  if (!rawId) return res.status(400).json({ error: "blogId 파라미터가 필요합니다." });

  // blog.naver.com/아이디 형태로 붙여넣어도 동작하도록
  const blogId = rawId.replace(/^https?:\/\/(m\.)?blog\.naver\.com\//i, "").split(/[/?#]/)[0].trim();
  if (!blogId) return res.status(400).json({ error: "블로그 아이디를 확인해주세요." });

  const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
  const size = Math.min(Math.max(parseInt(req.query.size, 10) || 10, 1), 30);

  const endpoints = [
    `https://blog.naver.com/PostTitleListAsync.naver?blogId=${encodeURIComponent(blogId)}&viewdate=&currentPage=${page}&categoryNo=&parentCategoryNo=&countPerPage=${size}`,
    `https://blog.naver.com/PostTitleListAsync.nhn?blogId=${encodeURIComponent(blogId)}&viewdate=&currentPage=${page}&categoryNo=&parentCategoryNo=&countPerPage=${size}`,
  ];

  let lastError = "";

  for (const url of endpoints) {
    try {
      const r = await fetch(url, {
        headers: {
          "User-Agent": UA,
          Accept: "application/json, text/plain, */*",
          "Accept-Language": "ko-KR,ko;q=0.9",
          Referer: `https://blog.naver.com/${blogId}`,
        },
        signal: AbortSignal.timeout(12000),
      });

      if (!r.ok) {
        lastError = `네이버 응답 오류 (${r.status})`;
        continue;
      }

      const raw = await r.text();
      const { list, totalCount } = parsePostList(raw);

      if (!list.length) {
        lastError = page > 1 ? "이 페이지에는 게시글이 없습니다." : "게시글을 찾을 수 없어요. 블로그 아이디를 확인해주세요.";
        continue;
      }

      const total = totalCount || list.length;
      return res.status(200).json({
        success: true,
        blogId,
        page,
        size,
        totalCount: total,
        totalPages: Math.max(Math.ceil(total / size), 1),
        posts: list.map((p) => ({
          ...p,
          link: `https://blog.naver.com/${blogId}/${p.postNo}`,
        })),
      });
    } catch (err) {
      lastError = err?.name === "TimeoutError" ? "요청 시간 초과. 다시 시도해주세요." : err.message || "서버 오류";
    }
  }

  // ── 목록 API 실패 → RSS fallback (1페이지만) ──
  if (page === 1) {
    try {
      const rss = await fetchViaRss(blogId, size);
      if (rss && rss.list.length) {
        return res.status(200).json({
          success: true,
          blogId,
          page: 1,
          size,
          totalCount: rss.totalCount,
          totalPages: 1,
          fallback: "rss",
          notice: "전체 목록을 불러오지 못해 RSS(최근 글)로 대체했습니다.",
          posts: rss.list.map((p) => ({
            ...p,
            link: `https://blog.naver.com/${blogId}/${p.postNo}`,
          })),
        });
      }
    } catch (e) {}
  }

  return res.status(200).json({ success: false, posts: [], error: lastError || "게시글 목록을 불러오지 못했습니다." });
}
