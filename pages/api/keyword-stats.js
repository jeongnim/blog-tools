// pages/api/keyword-stats.js
import crypto from "crypto";

export const config = { maxDuration: 30 };

// 네이버 광고 API는 hintKeywords에 공백을 허용하지 않음.
// 또한 응답의 relKeyword는 공백 제거 + 영문 대문자로 정규화되어 돌아옴.
const normKeyword = (s) => (s || "").replace(/\s+/g, "").toUpperCase();

// 네이버 자동완성 API - 신조어/광고DB 없는 키워드 연관어 보완용
async function fetchAutoComplete(keyword) {
  try {
    const url = `https://ac.search.naver.com/nx/ac?q=${encodeURIComponent(keyword)}&q_enc=UTF-8&st=111&frm=nv&r_format=json&r_enc=UTF-8&r_unicode=0&t_koreng=1&ans=2&run=2&rev=4&con=1`;
    const res = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0", "Referer": "https://search.naver.com/" }
    });
    if (!res.ok) return [];
    const data = await res.json();
    // items[0] = 자동완성 목록
    return (data?.items?.[0] || []).map(item => item[0]).filter(Boolean).slice(0, 8);
  } catch(e) { return []; }
}

export default async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).json({ error: "GET만 허용" });

  const { keywords } = req.query;
  if (!keywords) return res.status(400).json({ error: "keywords 파라미터 필요" });

  const API_KEY     = process.env.NAVER_API_KEY;
  const SECRET_KEY  = process.env.NAVER_SECRET_KEY;
  const CUSTOMER_ID = process.env.NAVER_CUSTOMER_ID;

  if (!API_KEY || !SECRET_KEY || !CUSTOMER_ID) {
    return res.status(200).json({ error: "네이버 광고 API 환경변수 없음", keywordList: [] });
  }

  // 원본(공백 포함) — 자동완성 조회용
  const rawList = keywords.split(",").map(k => k.trim()).filter(Boolean);
  // 정규화(공백 제거 + 대문자) 후 중복 제거, hintKeywords는 최대 5개
  const keywordList = [...new Set(rawList.map(normKeyword))].filter(Boolean).slice(0, 5);

  if (keywordList.length === 0) {
    return res.status(200).json({ error: "유효한 키워드 없음", keywordList: [] });
  }

  try {
    const timestamp = Date.now().toString();
    const method    = "GET";
    const path      = "/keywordstool";
    const message   = `${timestamp}.${method}.${path}`;
    const signature = crypto.createHmac("sha256", SECRET_KEY).update(message).digest("base64");
    const params = keywordList.map(k => `hintKeywords=${encodeURIComponent(k)}`).join("&") + "&showDetail=1&includeHintKeywords=1";
    const apiUrl  = `https://api.naver.com/keywordstool?${params}`;

    const response = await fetch(apiUrl, {
      headers: {
        "X-Timestamp":  timestamp,
        "X-API-KEY":    API_KEY,
        "X-Customer":   CUSTOMER_ID,
        "X-Signature":  signature,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const errText = await response.text();
      return res.status(200).json({
        error: `API 오류 ${response.status}`,
        detail: errText,
        sentKeywords: keywordList,   // 디버깅용: 실제로 보낸 값
        keywordList: [],
      });
    }

    const data = await response.json();

    // 연관검색어가 부족할 때 자동완성으로 보완
    const mainRaw  = rawList[0];
    const mainNorm = keywordList[0];
    const relCount = (data.keywordList || []).filter(
      i => normKeyword(i.relKeyword) !== mainNorm
    ).length;

    let autoComplete = [];
    if (relCount < 3) {
      // 자동완성은 공백 있는 원본이 더 잘 잡힘
      autoComplete = await fetchAutoComplete(mainRaw);
    }

    res.status(200).json({ ...data, autoComplete, sentKeywords: keywordList });

  } catch (err) {
    res.status(200).json({ error: err.message, keywordList: [] });
  }
}
