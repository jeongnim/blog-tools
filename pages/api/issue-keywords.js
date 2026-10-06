// pages/api/issue-keywords.js
// 카테고리별 "지금 뉴스에서 뜨는" 기사 제목 모음 (AI 없음)
//  - 구글 뉴스 RSS (공개, 최근 1일) — 카테고리별 대표 검색어 몇 개로 모은다
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
  "IT·가전": ["가전 신제품", "IT 신제품", "노트북"], "스마트폰·앱": ["스마트폰", "아이폰", "갤럭시", "카카오톡 업데이트", "통신사 요금제"], "AI·기술트렌드": ["AI 서비스", "챗GPT", "생성형 AI"],
  "건강·의학정보": ["건강", "질병관리청", "건강보험"], "멘탈케어·심리": ["정신건강", "스트레스"], "한방·영양제": ["영양제", "건강기능식품"],
  "재테크·투자": ["재테크", "금리", "적금"], "부동산": ["부동산", "청약", "전세"], "주식·ETF": ["주식", "ETF", "코스피"], "보험·연금": ["보험", "국민연금", "실손보험"],
  "영화": ["개봉 영화", "박스오피스"], "드라마": ["드라마 시청률", "새 드라마"], "음악·공연": ["콘서트", "음원 차트"], "책·독서": ["베스트셀러", "신간 도서"],
  "웹툰·만화": ["웹툰", "만화"], "스타·연예인": ["연예", "아이돌"], "방송": ["예능", "방송"],
};

const CACHE = new Map(); const TTL = 20 * 60 * 1000;
const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";
const decode = s => String(s || "").replace(/<!\[CDATA\[|\]\]>/g, "").replace(/<[^>]+>/g, "")
  .replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").trim();

async function googleNews(q) {
  const url = `https://news.google.com/rss/search?q=${encodeURIComponent(q + " when:1d")}&hl=ko&gl=KR&ceid=KR:ko`;
  const r = await fetch(url, { headers: { "User-Agent": UA } });
  if (!r.ok) throw new Error("구글 뉴스 " + r.status);
  const xml = await r.text();
  return [...xml.matchAll(/<item>([\s\S]*?)<\/item>/g)].slice(0, 25).map(m => {
    const it = m[1];
    const t = decode((it.match(/<title>([\s\S]*?)<\/title>/) || [])[1]);
    const src = decode((it.match(/<source[^>]*>([\s\S]*?)<\/source>/) || [])[1]);
    const date = (it.match(/<pubDate>([\s\S]*?)<\/pubDate>/) || [])[1] || "";
    return { title: src && t.endsWith(" - " + src) ? t.slice(0, -(src.length + 3)) : t.replace(/\s-\s[^-]+$/, ""), source: src, date, seed: q };
  });
}
async function naverNews(q) {
  const id = process.env.NAVER_CLIENT_ID, secret = process.env.NAVER_CLIENT_SECRET;
  if (!id || !secret) return [];
  const r = await fetch(`https://openapi.naver.com/v1/search/news.json?query=${encodeURIComponent(q)}&display=30&sort=date`,
    { headers: { "X-Naver-Client-Id": id, "X-Naver-Client-Secret": secret } });
  if (!r.ok) return [];   // 뉴스 검색이 신청 안 된 키면 조용히 건너뜀
  const j = await r.json().catch(() => null);
  const dayAgo = Date.now() - 36 * 3600 * 1000;
  return (j?.items || []).filter(x => new Date(x.pubDate).getTime() > dayAgo)
    .map(x => ({ title: decode(x.title), source: "네이버 뉴스", date: x.pubDate, seed: q }));
}

export default async function handler(req, res) {
  if (!requireAuth(req, res)) return;
  const category = String(req.query.category || "").trim();
  if (!category) return res.status(400).json({ error: "category 필요" });
  const hit = CACHE.get(category);
  if (hit && Date.now() - hit.at < TTL) return res.status(200).json({ ...hit.data, cached: true });

  const seeds = SEEDS[category] || category.split(/[·,\/\s]+/).filter(Boolean);
  const jobs = seeds.flatMap(q => [googleNews(q).catch(() => []), naverNews(q).catch(() => [])]);
  const all = (await Promise.all(jobs)).flat();
  const flat = t => t.replace(/[\s\[\]【】()"'“”‘’…·,.!?~-]/g, "");
  const seen = new Set(); const titles = [];
  for (const x of all) { const k = flat(x.title).slice(0, 40); if (!k || seen.has(k)) continue; seen.add(k); titles.push(x); }
  const data = { category, seeds, titles: titles.slice(0, 90), fetchedAt: Date.now() };
  CACHE.set(category, { at: Date.now(), data });
  res.status(200).json(data);
}
