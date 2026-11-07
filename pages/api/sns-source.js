// pages/api/sns-source.js — SNS 변환용: 블로그 글(제목·본문·사진 주소) 가져오기 + 사진 대신 받아주기
//   POST { url }            → { success, title, text, images:[url...] }   (네이버 블로그·티스토리)
//   POST { action:"list", blog }  → { success, posts:[{title,link,date}] }  (티스토리·RSS 있는 블로그 최신 글 목록 — 네이버는 /api/blog-posts 사용)
//   GET  ?img=사진주소       → 사진 바이트 (네이버·카카오 사진 서버만 — 캔버스에서 쓰려고 같은 주소로 내려줌)
import { requireAuth } from "../../lib/auth";

const UA = "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1";
const IMG_HOSTS = /(^|\.)(pstatic\.net|naver\.net|daumcdn\.net|kakaocdn\.net|tistory\.com)$/i;
const MAX_IMG = 15 * 1024 * 1024;

function isPublicHost(h) {
  h = String(h || "").toLowerCase();
  if (!h || h === "localhost" || h.endsWith(".local") || h.endsWith(".internal")) return false;
  if (/^\d+\.\d+\.\d+\.\d+$/.test(h) || h.includes(":")) return false;      // IP 직접 입력 막기
  return h.includes(".");
}

// 리다이렉트도 한 단계씩 주소 검사
async function safeFetch(url, check, opts = {}, hops = 4) {
  let u = url;
  for (let i = 0; i <= hops; i++) {
    const p = new URL(u);
    if (p.protocol !== "https:" && p.protocol !== "http:") throw new Error("주소 형식 오류");
    if (!check(p.hostname)) throw new Error("허용되지 않은 주소");
    const r = await fetch(u, { ...opts, redirect: "manual" });
    if (r.status >= 300 && r.status < 400 && r.headers.get("location")) { u = new URL(r.headers.get("location"), u).toString(); continue; }
    return r;
  }
  throw new Error("리다이렉트가 너무 많아요");
}

const ent = s => String(s || "")
  .replace(/&nbsp;|&#160;/g, " ").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"')
  .replace(/&#39;|&#x27;|&apos;/g, "'").replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(+n))
  .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16))).replace(/&amp;/g, "&");
const strip = h => ent(String(h || "")
  .replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/gi, "")
  .replace(/<br\s*\/?>/gi, "\n").replace(/<\/(p|div|li|h\d|tr|blockquote)>/gi, "\n").replace(/<[^>]+>/g, ""))
  .replace(/[ \t]+/g, " ").replace(/\n\s*\n+/g, "\n\n").trim();
const meta = (html, prop) => {
  const m = html.match(new RegExp(`<meta[^>]+(?:property|name)=["']${prop}["'][^>]*content=["']([^"']*)["']`, "i"))
    || html.match(new RegExp(`<meta[^>]+content=["']([^"']*)["'][^>]*(?:property|name)=["']${prop}["']`, "i"));
  return m ? ent(m[1]).trim() : "";
};
const attr = (tag, name) => { const m = tag.match(new RegExp(`\\s${name}=["']([^"']+)["']`, "i")); return m ? ent(m[1]) : ""; };

function naverTarget(u) {
  const p = new URL(u);
  if (!/(^|\.)blog\.naver\.com$/i.test(p.hostname)) return null;
  let id = p.searchParams.get("blogId"), no = p.searchParams.get("logNo");
  if (!id || !no) { const m = p.pathname.match(/^\/([^/]+)\/(\d+)/); if (m) { id = m[1]; no = m[2]; } }
  return id && no ? `https://m.blog.naver.com/${id}/${no}` : null;
}

function parseNaver(html) {
  const title = ent((html.match(/class="se-title-text[^"]*"[\s\S]*?<span[^>]*>([\s\S]*?)<\/span>/i) || [])[1] || "").replace(/<[^>]+>/g, "").trim()
    || meta(html, "og:title");
  const start = html.search(/class="se-main-container/i);
  let body = start >= 0 ? html.slice(start) : (html.match(/id="postViewArea"[\s\S]*/i) || [html])[0];
  const end = body.search(/<[a-z]+[^>]*class="[^"]*(?:post_footer_contents|ssp-adcontent|comment_area|btn_area_btm)/i);
  if (end > 0) body = body.slice(0, end);
  // 글·사진을 나온 순서대로 → 본문에 [사진N] 표시 (어느 내용 옆 사진인지 AI가 알 수 있게)
  const images = [], parts = [];
  const re = /<(p|span)[^>]*class="[^"]*se-text-paragraph[^"]*"[^>]*>([\s\S]*?)<\/\1>|<img\b[^>]*>/gi;
  for (const m of body.matchAll(re)) {
    if (m[2] !== undefined) { const t = strip(m[2]); if (t) parts.push(t); continue; }
    const t = m[0];
    if (/se-sticker|storep-phinf|map\.pstatic|static\.map|profile|og_image/i.test(t)) continue;
    let src = attr(t, "data-lazy-src") || attr(t, "src");
    if (!src || !/pstatic\.net/.test(src) || !(/se-image-resource|egjs-visible|postfiles|blogfiles|mblogthumb/i.test(t) || /phinf/.test(src))) continue;
    src = src.replace(/([?&])type=[^&]*/, "$1type=w966");
    if (!/type=/.test(src)) src += (src.includes("?") ? "&" : "?") + "type=w966";
    if (images.includes(src) || images.length >= 30) continue;
    images.push(src); parts.push(`[사진${images.length}]`);
  }
  const text = parts.some(x => !/^\[사진\d+\]$/.test(x)) ? parts.join("\n") : strip(body);
  return { title, text, images };
}

function parseGeneric(html) {
  const title = meta(html, "og:title") || strip((html.match(/<title[^>]*>([\s\S]*?)<\/title>/i) || [])[1] || "");
  let body = "";
  for (const re of [/<div[^>]+class="[^"]*tt_article_useless_p_margin[^"]*"[^>]*>/i, /<div[^>]+class="[^"]*(?:entry-content|article-view|contents_style)[^"]*"[^>]*>/i,
    /<div[^>]+id="article-view"[^>]*>/i, /<article\b[^>]*>/i]) {
    const i = html.search(re);
    if (i >= 0) { body = html.slice(i); break; }
  }
  if (!body) body = (html.match(/<body[\s\S]*/i) || [html])[0];
  const end = body.search(/<[a-z]+[^>]*class="[^"]*(?:another_category|container_postbtn|tt-box-total|revenue_unit_wrap|wrap_reply|area_reply)|<!--\s*System - START|<\/article>/i);
  if (end > 0) body = body.slice(0, end);
  const images = [];
  const marked = body.replace(/<img\b[^>]*>/gi, tag => {
    let src = attr(tag, "data-src") || attr(tag, "data-origin-src") || attr(tag, "src");
    if (!src || src.startsWith("data:") || /emoticon|profile|icon|logo/i.test(src)) return "";
    const fname = src.match(/[?&]fname=([^&]+)/);           // 티스토리 썸네일 주소 → 원본
    if (fname) src = decodeURIComponent(fname[1]);
    if (src.startsWith("//")) src = "https:" + src;
    if (images.includes(src) || images.length >= 30) return "";
    images.push(src);
    return `\n[사진${images.length}]\n`;
  }).replace(/<figcaption[\s\S]*?<\/figcaption>/gi, "");
  const text = strip(marked);
  return { title, text, images };
}

export const config = { api: { responseLimit: false } };

// 티스토리 등 RSS 로 최신 글 목록 (xxx.tistory.com / 개인 도메인 모두 /rss)
async function rssList(blog) {
  let host = String(blog || "").trim().replace(/^https?:\/\//i, "").split(/[/?#]/)[0];
  if (!host) throw new Error("블로그 주소를 넣어주세요");
  if (!host.includes(".")) host = `${host}.tistory.com`;          // 아이디만 넣으면 티스토리로
  const r = await safeFetch(`https://${host}/rss`, isPublicHost, { headers: { "User-Agent": UA, Accept: "application/rss+xml, application/xml, text/xml, */*" } });
  if (!r.ok) throw new Error(`글 목록을 못 가져왔어요 (${r.status}) — 주소를 확인해 주세요`);
  const xml = await r.text();
  const pick = (chunk, tag) => {
    const m = chunk.match(new RegExp(`<${tag}[^>]*>(?:<!\\[CDATA\\[)?([\\s\\S]*?)(?:\\]\\]>)?<\\/${tag}>`, "i"));
    return m ? ent(m[1]).trim() : "";
  };
  const posts = (xml.match(/<item[\s>][\s\S]*?<\/item>/gi) || []).map(it => {
    const d = new Date(pick(it, "pubDate"));
    const date = isNaN(d) ? "" : `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")}`;
    return { title: pick(it, "title") || "(제목 없음)", link: pick(it, "link"), date };
  }).filter(p => p.link);
  if (!posts.length) throw new Error("글이 없거나 RSS 가 꺼져 있어요 (티스토리 관리 → 설정 → RSS 공개 확인)");
  return { host, posts: posts.slice(0, 50) };
}

export default async function handler(req, res) {
  if (!requireAuth(req, res)) return;
  try {
    if (req.method === "GET" && req.query.img) {
      const u = String(req.query.img);
      const r = await safeFetch(u, h => IMG_HOSTS.test(h), {
        headers: { "User-Agent": UA, Referer: /pstatic|naver/.test(u) ? "https://blog.naver.com/" : "https://www.tistory.com/" },
      });
      if (!r.ok) return res.status(502).json({ error: `사진을 못 받았어요 (${r.status})` });
      const type = r.headers.get("content-type") || "image/jpeg";
      if (!/^image\//i.test(type)) return res.status(415).json({ error: "사진이 아니에요" });
      const buf = Buffer.from(await r.arrayBuffer());
      if (buf.length > MAX_IMG) return res.status(413).json({ error: "사진이 너무 커요" });
      res.setHeader("Content-Type", type);
      res.setHeader("Cache-Control", "private, max-age=3600");
      return res.status(200).send(buf);
    }
    if (req.method !== "POST") return res.status(405).json({ error: "POST만 허용" });
    if ((req.body || {}).action === "list") {
      const { host, posts } = await rssList(req.body.blog);
      return res.status(200).json({ success: true, host, posts });
    }
    const raw = String((req.body || {}).url || "").trim();
    let u;
    try { u = new URL(raw); } catch (e) { return res.status(200).json({ error: "주소 형식이 아니에요" }); }
    const nav = naverTarget(u.toString());
    const target = nav || u.toString();
    const r = await safeFetch(target, isPublicHost, { headers: { "User-Agent": UA, "Accept-Language": "ko-KR,ko;q=0.9" } });
    if (!r.ok) return res.status(200).json({ error: `글을 못 가져왔어요 (${r.status}) — 직접 붙여넣기를 써 주세요` });
    const html = await r.text();
    const out = nav ? parseNaver(html) : parseGeneric(html);
    if (!out.text || out.text.length < 50) return res.status(200).json({ error: "본문을 찾지 못했어요 (비공개 글이거나 형식이 달라요) — 직접 붙여넣기를 써 주세요" });
    return res.status(200).json({ success: true, title: out.title, text: out.text.slice(0, 20000), images: out.images.slice(0, 30) });
  } catch (e) {
    return res.status(200).json({ error: e.message || "가져오기 실패" });
  }
}
