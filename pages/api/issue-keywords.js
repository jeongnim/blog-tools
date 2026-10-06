// pages/api/issue-keywords.js
// 카테고리별 "지금 뉴스에서 뜨는" 기사 제목 모음 (AI 없음)
//  - 구글 뉴스 RSS / Bing 뉴스 RSS (공개, 기본 최근 7일) — 카테고리별 대표 검색어 몇 개로 모은다
//  - 네이버 뉴스 검색 API (개발자센터 키에 뉴스 검색이 있으면 함께, 없으면 건너뜀)
// 기사 제목에서 이슈 키워드를 뽑는 건 화면에서 Haiku 1회, 검색량은 검색광고 API(무료)로 붙인다.
import { requireAuth } from "../../lib/auth";

export const config = { maxDuration: 25 };

const SEEDS = {
  "요리·레시피": ["레시피", "요리", "제철 음식"], "맛집": ["맛집", "신메뉴 출시", "프랜차이즈 신메뉴"], "카페·디저트": ["카페 신메뉴", "디저트", "편의점 디저트"],
  "살림·생활꿀팁": ["생활 꿀팁", "생활비 절약", "가전 사용법"], "패션·뷰티": ["뷰티 신제품", "화장품", "패션 트렌드"], "인테리어·DIY": ["인테리어", "셀프 인테리어", "가구"],
  "원예·식물": ["반려식물", "가드닝"], "상품리뷰": ["신제품 출시", "가성비 제품"], "국내여행": ["국내 여행", "축제", "여행지 추천"], "세계여행": ["해외여행", "항공권", "환율 여행"],
  "자동차": ["자동차 신차", "자동차 리콜", "자동차 보험"], "중고차·신차": ["신차 출시", "중고차 시세"], "전기차·하이브리드": ["전기차", "하이브리드", "전기차 보조금"],
  "게임": ["신작 게임", "게임 업데이트"], "스포츠": ["프로야구", "축구 국가대표", "스포츠"], "취미": ["취미", "원데이 클래스"],
  "반려견": ["반려견", "강아지"], "반려묘": ["반려묘", "고양이"], "반려동물 건강": ["반려동물 건강", "동물병원"],
  "육아·아이": ["육아", "아동수당", "어린이집"], "임신·출산": ["임신 출산 지원", "출산 지원금"], "교육·학습": ["교육", "수능", "자격증 시험"], "유아교육·장난감": ["유아 교육", "장난감"],
  "IT·가전": ["삼성 가전", "LG 가전", "노트북", "태블릿", "애플"], "스마트폰·앱": ["갤럭시", "아이폰", "애플", "삼성 스마트폰", "카카오톡", "통신사 요금제"], "AI·기술트렌드": ["AI 서비스", "챗GPT", "생성형 AI"],
  "건강·의학정보": ["건강", "질병관리청", "건강보험"], "멘탈케어·심리": ["정신건강", "스트레스"], "한방·영양제": ["영양제", "건강기능식품"],
  "재테크·투자": ["재테크", "금리", "적금"], "부동산": ["부동산", "청약", "전세"], "주식·ETF": ["주식", "ETF", "코스피"], "보험·연금": ["보험", "국민연금", "실손보험"],
  "영화": ["개봉 영화", "박스오피스"], "드라마": ["드라마 시청률", "새 드라마"], "음악·공연": ["콘서트", "음원 차트"], "책·독서": ["베스트셀러", "신간 도서"],
  "웹툰·만화": ["웹툰", "만화"], "스타·연예인": ["연예", "아이돌"], "방송": ["예능", "방송"],
};

// 네이버 뉴스 섹션 (sid1-sid2). 이 카테고리는 검색어 그물 대신 섹션 기사 목록을 그대로 쓴다 (집 PC 프록시)
const SECTIONS = {
  "스마트폰·앱": ["105-731", "105-227", "105-226"], "IT·가전": ["105-230", "105-283"], "AI·기술트렌드": ["105-230", "105-228"],
  "게임": ["105-229"], "재테크·투자": ["101-259", "101-310"], "주식·ETF": ["101-258"], "부동산": ["101-260"], "보험·연금": ["101-259", "101-310"],
  "자동차": ["103-239"], "중고차·신차": ["103-239"], "전기차·하이브리드": ["103-239", "101-261"],
  "건강·의학정보": ["103-241"], "한방·영양제": ["103-241"], "멘탈케어·심리": ["103-241"],
  "국내여행": ["103-237"], "세계여행": ["103-237"], "맛집": ["103-238"], "요리·레시피": ["103-238"], "카페·디저트": ["103-238"],
  "패션·뷰티": ["103-376"], "음악·공연": ["103-242"], "책·독서": ["103-243"], "교육·학습": ["102-250"], "살림·생활꿀팁": ["101-310", "103-245"],
};

async function naverSections(category) {
  const secs = SECTIONS[category]; if (!secs) return null;
  const proxyUrl = process.env.HOME_PROXY_URL, proxyKey = process.env.HOME_PROXY_KEY;
  if (!proxyUrl || !proxyKey) throw new Error("프록시 미설정");
  const r = await fetch(`${proxyUrl}/naver-news-section?sections=${encodeURIComponent(secs.join(","))}&key=${encodeURIComponent(proxyKey)}`);
  if (r.status === 404) throw new Error("집 PC 프록시에 뉴스 섹션 기능 없음 (server.js 업데이트 필요)");
  const j = await r.json().catch(() => null);
  if (!r.ok || !j) throw new Error(j?.error || ("프록시 응답 " + r.status));
  // 헤드라인(관련기사 많은 순) 먼저, 그다음 최신 기사 — 앞에서 20개
  const head = j.items.filter(x => x.kind === "headline").sort((a, b) => (b.relatedCount || 0) - (a.relatedCount || 0));
  const latest = j.items.filter(x => x.kind !== "headline");
  return { items: [...head, ...latest].slice(0, 20).map(x => ({ title: x.title, link: x.link, source: x.press || "네이버 뉴스", relatedCount: x.relatedCount || 0, date: "" })), sources: j.sources };
}

const CACHE = new Map(); const TTL = 20 * 60 * 1000;
const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";
const decode = s => String(s || "").replace(/<!\[CDATA\[|\]\]>/g, "").replace(/<[^>]+>/g, "")
  .replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").trim();

async function googleNews(q, days) {
  const url = `https://news.google.com/rss/search?q=${encodeURIComponent(q + ` when:${days}d`)}&hl=ko&gl=KR&ceid=KR:ko`;
  const r = await fetch(url, { headers: { "User-Agent": UA } });
  if (!r.ok) throw new Error("구글 뉴스 " + r.status);
  const xml = await r.text();
  if (!/<item>/.test(xml)) throw new Error("구글 뉴스 응답에 기사가 없음");
  return [...xml.matchAll(/<item>([\s\S]*?)<\/item>/g)].slice(0, 40).map(m => {
    const it = m[1];
    const t = decode((it.match(/<title>([\s\S]*?)<\/title>/) || [])[1]);
    const src = decode((it.match(/<source[^>]*>([\s\S]*?)<\/source>/) || [])[1]);
    const date = (it.match(/<pubDate>([\s\S]*?)<\/pubDate>/) || [])[1] || "";
    return { title: src && t.endsWith(" - " + src) ? t.slice(0, -(src.length + 3)) : t.replace(/\s-\s[^-]+$/, ""), source: src, date, seed: q };
  });
}
// Bing 뉴스 RSS (공개) — 구글 뉴스가 막힐 때를 대비한 두 번째 출처
async function bingNews(q, days) {
  const r = await fetch(`https://www.bing.com/news/search?q=${encodeURIComponent(q)}&format=rss&setmkt=ko-KR&setlang=ko`, { headers: { "User-Agent": UA, "Accept-Language": "ko-KR,ko;q=0.9" } });
  if (!r.ok) throw new Error("Bing 뉴스 " + r.status);
  const xml = await r.text();
  if (!/<item>/.test(xml)) throw new Error("Bing 뉴스 응답에 기사가 없음");
  const since = Date.now() - days * 864e5;
  return [...xml.matchAll(/<item>([\s\S]*?)<\/item>/g)].slice(0, 40).map(m => {
    const it = m[1];
    return { title: decode((it.match(/<title>([\s\S]*?)<\/title>/) || [])[1]), source: decode((it.match(/<News:Source>([\s\S]*?)<\/News:Source>/i) || [])[1]) || "Bing",
      date: (it.match(/<pubDate>([\s\S]*?)<\/pubDate>/) || [])[1] || "", seed: q };
  }).filter(x => !x.date || new Date(x.date).getTime() >= since);
}
async function naverNews(q, days) {
  const id = process.env.NAVER_CLIENT_ID, secret = process.env.NAVER_CLIENT_SECRET;
  if (!id || !secret) return [];
  const r = await fetch(`https://openapi.naver.com/v1/search/news.json?query=${encodeURIComponent(q)}&display=30&sort=date`,
    { headers: { "X-Naver-Client-Id": id, "X-Naver-Client-Secret": secret } });
  if (!r.ok) throw new Error("네이버 뉴스 API " + r.status + (r.status === 401 || r.status === 403 ? " (뉴스 검색 미신청)" : ""));
  const j = await r.json().catch(() => null);
  const since = Date.now() - days * 864e5;
  return (j?.items || []).filter(x => new Date(x.pubDate).getTime() > since)
    .map(x => ({ title: decode(x.title), source: "네이버 뉴스", date: x.pubDate, seed: q }));
}

export default async function handler(req, res) {
  if (!requireAuth(req, res)) return;
  const category = String(req.query.category || "").trim();
  if (!category) return res.status(400).json({ error: "category 필요" });
  const days = Math.min(30, Math.max(1, parseInt(req.query.days || "7", 10) || 7));
  const extra = String(req.query.seeds || "").split(",").map(x => x.trim()).filter(Boolean).slice(0, 6);
  const ckey = category + "|" + days + "|" + extra.join(",");
  const hit = CACHE.get(ckey);
  if (hit && Date.now() - hit.at < TTL) return res.status(200).json({ ...hit.data, cached: true });

  // ① 네이버 뉴스 섹션이 있는 카테고리: 섹션 기사 제목 20개 (검색어 그물 없음)
  if (SECTIONS[category] && !extra.length) {
    try {
      const sec = await naverSections(category);
      if (sec && sec.items.length >= 5) {
        const data = { category, mode: "section", titles: sec.items, sections: sec.sources, fetchedAt: Date.now() };
        CACHE.set(ckey, { at: Date.now(), data });
        return res.status(200).json(data);
      }
    } catch (e) { req._sectionError = e.message; }   // 실패하면 아래 검색어 방식으로
  }

  // ② 섹션이 없거나 실패: 카테고리 대표 검색어로 구글·Bing·네이버 뉴스에서 모은다
  const seeds = [...new Set([...(SEEDS[category] || category.split(/[·,\/\s]+/).filter(Boolean)), ...extra])];
  // 출처별로 몇 건 왔는지·왜 실패했는지 같이 돌려준다 (0건일 때 원인 확인용)
  const stats = { google: { count: 0, errors: [] }, bing: { count: 0, errors: [] }, naver: { count: 0, errors: [] } };
  const run = (name, fn) => seeds.map(q => fn(q, days).then(list => { stats[name].count += list.length; return list; })
    .catch(e => { if (stats[name].errors.length < 2) stats[name].errors.push(e.message); return []; }));
  const all = (await Promise.all([...run("google", googleNews), ...run("bing", bingNews), ...run("naver", naverNews)])).flat()
    .sort((a, b) => (new Date(b.date).getTime() || 0) - (new Date(a.date).getTime() || 0));
  const flat = t => t.replace(/[\s\[\]【】()"'“”‘’…·,.!?~-]/g, "");
  const seen = new Set(); const titles = [];
  for (const x of all) { const k = flat(x.title).slice(0, 40); if (!k || seen.has(k)) continue; seen.add(k); titles.push(x); }
  const data = { category, mode: "search", seeds, days, titles: titles.slice(0, 160), stats, sectionError: req._sectionError || null, fetchedAt: Date.now() };
  if (titles.length >= 5) CACHE.set(ckey, { at: Date.now(), data });   // 실패한 결과는 캐시하지 않음
  res.status(200).json(data);
}
