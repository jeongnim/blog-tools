// pages/api/keyword-stats.js
// 서버에서 네이버 광고 API 호출 (CORS 문제 없음)

import crypto from "crypto";

const API_KEY     = process.env.NAVER_API_KEY;
const SECRET_KEY  = process.env.NAVER_SECRET_KEY;
const CUSTOMER_ID = process.env.NAVER_CUSTOMER_ID;

function makeSignature(timestamp, method, path) {
  const message = `${timestamp}.${method}.${path}`;
  return crypto.createHmac("sha256", SECRET_KEY).update(message).digest("base64");
}

export default async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).json({ error: "GET만 허용" });

  const { keywords } = req.query;
  if (!keywords) return res.status(400).json({ error: "keywords 파라미터 필요" });

  const keywordList = keywords.split(",").map(k => k.trim()).filter(Boolean).slice(0, 10);

  try {
    const timestamp = Date.now().toString();
    const method    = "GET";
    const path      = "/keywordstool";
    const signature = makeSignature(timestamp, method, path);
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
      return res.status(response.status).json({ error: `네이버 API 오류 ${response.status}`, detail: errText });
    }

    const data = await response.json();
    res.status(200).json(data);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
