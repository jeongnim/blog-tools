// pages/api/keyword-stats.js
import crypto from "crypto";

export const config = { maxDuration: 30 };

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

  const keywordList = keywords.split(",").map(k => k.trim()).filter(Boolean).slice(0, 10);

  try {
    const timestamp = Date.now().toString();
    const method    = "GET";
    const path      = "/keywordstool";
    const message   = `${timestamp}.${method}.${path}`;
    const signature = crypto.createHmac("sha256", SECRET_KEY).update(message).digest("base64");
    const params    = keywordList.map(k => `hintKeywords=${encodeURIComponent(k)}`).join("&") + "&showDetail=1";
    const apiUrl    = `https://api.naver.com/keywordstool?${params}`;

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
      return res.status(200).json({ error: `API 오류 ${response.status}`, detail: errText, keywordList: [] });
    }

    const data = await response.json();

    // 연관검색어가 부족할 때 자동완성으로 보완
    const mainKw = keywordList[0];
    const relCount = (data.keywordList || []).filter(
      i => i.relKeyword?.toLowerCase() !== mainKw?.toLowerCase()
    ).length;

    let autoComplete = [];
    if (relCount < 3) {
      autoComplete = await fetchAutoComplete(mainKw);
    }

    res.status(200).json({ ...data, autoComplete });

  } catch (err) {
    res.status(200).json({ error: err.message, keywordList: [] });
  }
}
