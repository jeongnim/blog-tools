// pages/api/gsc.js — 구글 서치콘솔(무료 API)로 티스토리 글의 구글 색인 여부·검색 실적 확인
// 필요: Vercel 환경변수 GSC_SA_JSON = 서비스 계정 JSON 키 전체 (서치콘솔 각 속성에 그 서비스 계정 이메일을 사용자로 추가)
import crypto from "crypto";
import { requireAuth } from "../../lib/auth";

export const config = { maxDuration: 25 };

// ── 서비스 계정 로그인 (추가 라이브러리 없이 JWT 서명) ──
let tokenCache = { token: "", exp: 0 };
function saInfo() {
  const raw = process.env.GSC_SA_JSON;
  if (!raw) return null;
  try {
    const j = JSON.parse(raw);
    if (!j.client_email || !j.private_key) return null;
    return { email: j.client_email, key: String(j.private_key).replace(/\\n/g, "\n") };
  } catch (e) { return null; }
}
const b64url = (b) => Buffer.from(b).toString("base64").replace(/=+$/, "").replace(/\+/g, "-").replace(/\//g, "_");
async function accessToken() {
  if (tokenCache.token && Date.now() < tokenCache.exp - 60000) return tokenCache.token;
  const sa = saInfo();
  if (!sa) throw new Error("GSC_SA_JSON 환경변수가 없거나 형식이 잘못됐어요");
  const now = Math.floor(Date.now() / 1000);
  const head = b64url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const claim = b64url(JSON.stringify({
    iss: sa.email, scope: "https://www.googleapis.com/auth/webmasters.readonly",
    aud: "https://oauth2.googleapis.com/token", iat: now, exp: now + 3600,
  }));
  const sig = crypto.createSign("RSA-SHA256").update(`${head}.${claim}`).sign(sa.key);
  const jwt = `${head}.${claim}.${b64url(sig)}`;
  const r = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: `grant_type=${encodeURIComponent("urn:ietf:params:oauth:grant-type:jwt-bearer")}&assertion=${jwt}`,
  });
  const d = await r.json();
  if (!r.ok || !d.access_token) throw new Error("구글 로그인 실패: " + (d.error_description || d.error || r.status));
  tokenCache = { token: d.access_token, exp: Date.now() + (d.expires_in || 3600) * 1000 };
  return tokenCache.token;
}
async function gapi(url, body) {
  const t = await accessToken();
  const r = await fetch(url, {
    method: body ? "POST" : "GET",
    headers: { Authorization: `Bearer ${t}`, "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  const d = await r.json().catch(() => ({}));
  if (!r.ok) {
    const msg = d?.error?.message || `HTTP ${r.status}`;
    if (r.status === 403) throw new Error(`권한 없음 — 서치콘솔 이 속성의 '사용자 및 권한'에 서비스 계정(${saInfo()?.email || ""})을 추가했는지 확인 (${msg})`);
    if (r.status === 429) throw new Error("오늘 검사 한도에 걸렸어요 — 내일 다시 해주세요 (" + msg + ")");
    throw new Error(msg);
  }
  return d;
}

// ── 티스토리 글 목록 (sitemap.xml + rss) ──
const blogBase = (b) => {
  const s = String(b || "").trim().toLowerCase().replace(/^https?:\/\//, "").replace(/\/.*$/, "");
  if (!s) return "";
  return "https://" + (s.includes(".") ? s : `${s}.tistory.com`);
};
async function getText(url) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 10000);
  try {
    const r = await fetch(url, { signal: ctrl.signal, headers: { "User-Agent": "Mozilla/5.0 (blog-tools gsc)" } });
    return r.ok ? await r.text() : "";
  } catch (e) { return ""; } finally { clearTimeout(t); }
}
const unxml = (s) => String(s || "").replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
  .replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, "&").trim();
// 제목 속 HTML 표시(&middot; &nbsp; &#183; 등)를 글자로
const ENT = { middot: "·", nbsp: " ", hellip: "…", lsquo: "‘", rsquo: "’", ldquo: "“", rdquo: "”", ndash: "–", mdash: "—", bull: "•", times: "×", rarr: "→", larr: "←", lt: "<", gt: ">", quot: '"', apos: "'", amp: "&" };
const deEnt = (s) => String(s || "").replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (m, e) => {
  if (e[0] === "#") { const n = e[1] === "x" || e[1] === "X" ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10); return n ? String.fromCodePoint(n) : m; }
  return ENT[e.toLowerCase()] ?? m;
});
// 같은 글 판별: 모바일 주소(/m/) 떼고, 주소 끝부분에서 글자·숫자만 남겨 비교 (?, |, 띄어쓰기 차이 무시)
const canon = (u) => {
  const n = norm(u).replace(/^https?:\/\/[^/]+/i, "").replace(/^\/m(?=\/)/, "");
  const last = n.split("/").pop() || n;
  return last.toLowerCase().replace(/[^\p{L}\p{N}]/gu, "");
};
const isPost = (u) => /\/entry\/|\/\d+\/?$/.test(u) && !/\/(category|tag|notice|guestbook|archive)\b/.test(u);
const norm = (u) => { try { return decodeURIComponent(u).replace(/\/$/, ""); } catch (e) { return u.replace(/\/$/, ""); } };

async function listPosts(blog) {
  const base = blogBase(blog);
  if (!base) throw new Error("블로그 주소가 비어 있어요");
  let xml = await getText(base + "/sitemap.xml");
  let urls = [];
  const addLocs = (x) => [...x.matchAll(/<url>([\s\S]*?)<\/url>/g)].forEach((m) => {
    const loc = unxml((m[1].match(/<loc>([\s\S]*?)<\/loc>/) || [])[1]);
    const mod = unxml((m[1].match(/<lastmod>([\s\S]*?)<\/lastmod>/) || [])[1]);
    if (loc && isPost(loc)) urls.push({ url: loc, date: mod ? mod.slice(0, 10) : "" });
  });
  if (/<sitemapindex/.test(xml)) {
    const subs = [...xml.matchAll(/<loc>([\s\S]*?)<\/loc>/g)].map((m) => unxml(m[1])).slice(0, 6);
    for (const s of subs) addLocs(await getText(s));
  } else addLocs(xml);
  // 제목·발행일은 rss 에서
  const rss = await getText(base + "/rss");
  const byUrl = {};
  [...rss.matchAll(/<item>([\s\S]*?)<\/item>/g)].forEach((m) => {
    const link = unxml((m[1].match(/<link>([\s\S]*?)<\/link>/) || [])[1]);
    const title = unxml((m[1].match(/<title>([\s\S]*?)<\/title>/) || [])[1]);
    const pub = unxml((m[1].match(/<pubDate>([\s\S]*?)<\/pubDate>/) || [])[1]);
    if (link) byUrl[norm(link)] = { url: link, title: deEnt(title), date: pub ? new Date(pub).toISOString().slice(0, 10) : "" };
  });
  const byCanon = {};
  Object.values(byUrl).forEach((r) => { byCanon[canon(r.url)] = r; });
  if (!urls.length) urls = Object.values(byUrl).map((r) => ({ url: r.url, date: r.date }));
  // 같은 글이 주소 두 가지(PC/모바일, 특수문자 차이 등)로 들어 있으면 하나로 — RSS 에 있는 주소를 남김
  const seen = new Set();
  const posts = urls.filter((p) => { const k = canon(p.url); if (seen.has(k)) return false; seen.add(k); return true; })
    .map((p) => {
      const r = byUrl[norm(p.url)] || byCanon[canon(p.url)] || {};
      const url = r.url || p.url.replace(/(\/\/[^/]+)\/m\//, "$1/");
      const slug = norm(url).split("/").pop();
      return { url, key: norm(url), title: r.title || deEnt(/^\d+$/.test(slug) ? `글 ${slug}` : slug.replace(/-/g, " ")), date: r.date || p.date };
    })
    .sort((a, b) => String(b.date).localeCompare(String(a.date)));
  return { base, posts };
}

// 서치콘솔 속성 주소 찾기 (https://xxx.tistory.com/ 형태)
async function findSite(blog) {
  const base = blogBase(blog);
  const d = await gapi("https://www.googleapis.com/webmasters/v3/sites");
  const list = (d.siteEntry || []).map((s) => s.siteUrl);
  const host = base.replace(/^https?:\/\//, "");
  const hit = list.find((s) => s === base + "/") || list.find((s) => s.replace(/^https?:\/\//, "").replace(/\/$/, "") === host)
    || list.find((s) => s === `sc-domain:${host}`);
  return { site: hit || "", all: list };
}

export default async function handler(req, res) {
  if (!requireAuth(req, res)) return;
  const { action, blog, url } = req.query;
  try {
    if (action === "check") {
      const sa = saInfo();
      if (!sa) return res.status(200).json({ ok: false, error: "GSC_SA_JSON 환경변수가 없어요" });
      const d = await gapi("https://www.googleapis.com/webmasters/v3/sites");
      return res.status(200).json({ ok: true, email: sa.email, sites: (d.siteEntry || []).map((s) => ({ url: s.siteUrl, perm: s.permissionLevel })) });
    }
    if (action === "posts") {
      const r = await listPosts(blog);
      let site = "";
      try { site = (await findSite(blog)).site; } catch (e) { /* 키가 없어도 글 목록은 보여준다 */ }
      return res.status(200).json({ ...r, site });
    }
    if (action === "inspect") {
      const { site } = await findSite(blog);
      if (!site) return res.status(200).json({ error: "서치콘솔에 이 블로그 속성이 없거나 서비스 계정 권한이 없어요" });
      const d = await gapi("https://searchconsole.googleapis.com/v1/urlInspection/index:inspect",
        { inspectionUrl: url, siteUrl: site, languageCode: "ko-KR" });
      const ir = d?.inspectionResult?.indexStatusResult || {};
      return res.status(200).json({
        url, site, verdict: ir.verdict || "", coverage: ir.coverageState || "", indexing: ir.indexingState || "",
        lastCrawl: ir.lastCrawlTime || "", robots: ir.robotsTxtState || "", fetch: ir.pageFetchState || "",
        link: d?.inspectionResult?.inspectionResultLink || "",
      });
    }
    if (action === "perf") {
      const { site } = await findSite(blog);
      if (!site) return res.status(200).json({ error: "서치콘솔에 이 블로그 속성이 없거나 서비스 계정 권한이 없어요" });
      const days = Math.min(480, Math.max(7, parseInt(req.query.days || "28", 10) || 28));
      const end = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
      const start = new Date(Date.now() - (days + 1) * 86400000).toISOString().slice(0, 10);
      const q = (dims) => gapi(`https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(site)}/searchAnalytics/query`,
        { startDate: start, endDate: end, dimensions: dims, rowLimit: 5000 });
      const [byPage, byPq] = await Promise.all([q(["page"]), q(["page", "query"])]);
      const pages = {};
      (byPage.rows || []).forEach((r) => { pages[norm(r.keys[0])] = { clicks: r.clicks, impressions: r.impressions, position: r.position, queries: [] }; });
      (byPq.rows || []).forEach((r) => {
        const k = norm(r.keys[0]);
        (pages[k] = pages[k] || { clicks: 0, impressions: 0, position: null, queries: [] }).queries.push({ q: r.keys[1], imp: r.impressions, clk: r.clicks, pos: r.position });
      });
      Object.values(pages).forEach((p) => { p.queries.sort((a, b) => b.imp - a.imp); p.queries = p.queries.slice(0, 5); });
      return res.status(200).json({ site, start, end, pages });
    }
    return res.status(400).json({ error: "action 은 check · posts · inspect · perf 중 하나" });
  } catch (e) {
    return res.status(200).json({ error: e.message || "오류" });
  }
}
