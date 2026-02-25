// pages/api/keyword-stats.js
import crypto from "crypto";

export const config = { maxDuration: 30 };

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
    res.status(200).json(data);

  } catch (err) {
    res.status(200).json({ error: err.message, keywordList: [] });
  }
}
