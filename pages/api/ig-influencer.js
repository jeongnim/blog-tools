// pages/api/ig-influencer.js
// 👶 인플루언서 찾기 — 인스타 공식 API(Business Discovery)로 다른 프로 계정의 공개 지표를 읽는다 (읽기 전용)
//
//   POST { action:"status" }                       → { ok, me:{username,followers} } 연결 확인
//   POST { action:"lookup", usernames:["a","b"] }  → { results:[{ username, ok, ...지표 } | { username, ok:false, error }] }
//        한 번에 최대 5개 (Vercel 시간 제한·인스타 호출 제한 때문에 화면에서 나눠서 부른다)
//
// Vercel 환경변수
//   IG_ACCESS_TOKEN : 회사 인스타와 연결된 페이스북 페이지의 토큰 (instagram_basic, pages_show_list, pages_read_engagement, business_management)
//   IG_USER_ID      : (선택) 회사 인스타 비즈니스 계정 ID — 비우면 토큰으로 자동으로 찾는다
import { requireAuth } from "../../lib/auth";

export const config = { maxDuration: 60 };

const GRAPH = "https://graph.facebook.com/v23.0";
const MEDIA_LIMIT = 15;          // 최근 글 몇 개로 평균을 낼지
let cachedId = null;             // 회사 인스타 계정 ID (서버 인스턴스별 캐시)

const sleep = ms => new Promise(r => setTimeout(r, ms));

async function g(path, token) {
  const r = await fetch(`${GRAPH}/${path}${path.includes("?") ? "&" : "?"}access_token=${encodeURIComponent(token)}`);
  const j = await r.json().catch(() => ({}));
  if (j.error) {
    const e = new Error(j.error.error_user_msg || j.error.message || "인스타 API 오류");
    e.code = j.error.code; e.sub = j.error.error_subcode;
    throw e;
  }
  return j;
}

async function myIgId(token) {
  if (process.env.IG_USER_ID) return process.env.IG_USER_ID.trim();
  if (cachedId) return cachedId;
  const j = await g("me/accounts?fields=name,instagram_business_account{id,username}&limit=50", token);
  const page = (j.data || []).find(p => p.instagram_business_account?.id);
  if (!page) throw new Error("토큰에 연결된 페이스북 페이지에서 인스타 비즈니스 계정을 못 찾았어요 — 인스타가 페이지와 연결됐는지 확인해 주세요");
  cachedId = page.instagram_business_account.id;
  return cachedId;
}

function friendly(e) {
  const m = String(e.message || "");
  if (e.code === 190) return "토큰이 만료됐거나 잘못됐어요 — 새 토큰을 Vercel에 넣어 주세요";
  if (e.code === 4 || e.code === 17 || e.code === 32 || e.code === 613 || /rate|limit/i.test(m)) return "RATE";
  if (e.code === 110 || /Cannot find User|does not exist|not found/i.test(m)) return "없는 계정이거나 개인 계정이라 조회가 안 돼요";
  if (e.code === 10 || e.code === 200) return "권한이 부족해요 — 토큰 권한(instagram_basic, pages_read_engagement)을 확인해 주세요";
  return m.slice(0, 160);
}

const GG_RE = /공구|공동구매|오픈|마감|구매링크|프로필 링크|할인코드|협찬|광고|제공받|#ad\b|체험단/;
const MENTION_RE = /@([A-Za-z0-9._]{2,30})/g;

function analyze(bd) {
  const media = (bd.media?.data || []).slice(0, MEDIA_LIMIT);
  const avg = a => a.length ? a.reduce((x, y) => x + y, 0) / a.length : null;
  const comments = media.map(m => Number(m.comments_count) || 0);
  const likes = media.filter(m => typeof m.like_count === "number").map(m => m.like_count);   // 좋아요 숨긴 글은 빠짐
  const reels = media.filter(m => typeof m.view_count === "number");
  const views = reels.map(m => m.view_count);
  const f = Number(bd.followers_count) || 0;
  const avgC = avg(comments), avgL = avg(likes), avgV = avg(views);
  const last = media[0]?.timestamp || null;
  const days = last ? Math.floor((Date.now() - new Date(last).getTime()) / 86400000) : null;
  const ggPosts = media.filter(m => GG_RE.test(m.caption || ""));
  const mentions = {};
  for (const m of media) for (const x of String(m.caption || "").matchAll(MENTION_RE)) {
    const u = x[1].replace(/\.$/, "").toLowerCase();
    if (u !== String(bd.username || "").toLowerCase()) mentions[u] = (mentions[u] || 0) + 1;
  }
  const bio = String(bd.biography || "");
  const email = (bio.match(/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/) || [])[0] || "";
  const kakao = /카톡|카카오|open\.kakao|오픈채팅/.test(bio + " " + (bd.website || ""));
  return {
    username: bd.username, name: bd.name || "", bio, website: bd.website || "", email, kakao,
    followers: f, posts: Number(bd.media_count) || 0, pic: bd.profile_picture_url || "",
    sample: media.length, reelCount: reels.length,
    avgComments: avgC, avgLikes: avgL, avgViews: avgV,
    commentRate: f && avgC != null ? avgC / f : null,
    viewRate: f && avgV != null ? avgV / f : null,
    lastPostDays: days, lastPost: last,
    gonggu: ggPosts.length, gongguLink: ggPosts[0]?.permalink || "",
    mentions: Object.entries(mentions).sort((a, b) => b[1] - a[1]).map(([u]) => u).slice(0, 30),
  };
}

export default async function handler(req, res) {
  if (!requireAuth(req, res)) return;
  if (req.method !== "POST") return res.status(405).json({ error: "POST만 허용" });
  const token = String(process.env.IG_ACCESS_TOKEN || "").trim();
  if (!token) return res.status(200).json({ error: "NO_TOKEN" });
  const { action, usernames } = req.body || {};

  try {
    const me = await myIgId(token);
    if (action === "status") {
      const j = await g(`${me}?fields=username,followers_count`, token);
      return res.status(200).json({ ok: true, me: { username: j.username, followers: j.followers_count } });
    }
    if (action === "lookup") {
      const list = [...new Set((Array.isArray(usernames) ? usernames : [])
        .map(u => String(u || "").trim().replace(/^@/, "").replace(/^https?:\/\/(www\.)?instagram\.com\//i, "").replace(/[/?#].*$/, "").toLowerCase())
        .filter(u => /^[a-z0-9._]{1,30}$/.test(u)))].slice(0, 5);
      const results = [];
      for (const u of list) {
        const fields = `business_discovery.username(${u}){username,name,biography,website,followers_count,media_count,profile_picture_url,` +
          `media.limit(${MEDIA_LIMIT}){caption,comments_count,like_count,view_count,media_type,media_product_type,timestamp,permalink}}`;
        try {
          const j = await g(`${me}?fields=${encodeURIComponent(fields)}`, token);
          results.push({ ok: true, ...analyze(j.business_discovery || {}) });
        } catch (e) {
          const fm = friendly(e);
          if (fm === "RATE") { results.push({ username: u, ok: false, rate: true, error: "인스타 호출 한도 — 잠시 후 이어서 해요" }); break; }
          if (e.code === 190) return res.status(200).json({ error: fm });
          results.push({ username: u, ok: false, error: fm });
        }
        await sleep(400);
      }
      return res.status(200).json({ results });
    }
    return res.status(200).json({ error: "알 수 없는 요청" });
  } catch (e) {
    const fm = friendly(e);
    return res.status(200).json({ error: fm === "RATE" ? "인스타 호출 한도에 걸렸어요 — 잠시 후 다시" : fm });
  }
}
