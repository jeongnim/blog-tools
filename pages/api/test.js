export default async function handler(req, res) {
  const crypto = (await import("crypto")).default;

  const API_KEY     = process.env.NAVER_API_KEY;
  const SECRET_KEY  = process.env.NAVER_SECRET_KEY;
  const CUSTOMER_ID = process.env.NAVER_CUSTOMER_ID;

  // 환경변수 확인
  if (!API_KEY || !SECRET_KEY || !CUSTOMER_ID) {
    return res.status(200).json({
      status: "❌ 네이버 환경변수 없음",
      NAVER_API_KEY: API_KEY ? API_KEY.substring(0,10)+"..." : "없음",
      NAVER_SECRET_KEY: SECRET_KEY ? "있음" : "없음",
      NAVER_CUSTOMER_ID: CUSTOMER_ID || "없음",
    });
  }

  try {
    const timestamp = Date.now().toString();
    const method = "GET";
    const path = "/keywordstool";
    const message = `${timestamp}.${method}.${path}`;
    const signature = crypto.createHmac("sha256", SECRET_KEY).update(message).digest("base64");
    const apiUrl = `https://api.naver.com/keywordstool?hintKeywords=${encodeURIComponent("kt올레")}&showDetail=1`;

    const response = await fetch(apiUrl, {
      headers: {
        "X-Timestamp": timestamp,
        "X-API-KEY": API_KEY,
        "X-Customer": CUSTOMER_ID,
        "X-Signature": signature,
        "Content-Type": "application/json",
      },
    });

    const text = await response.text();
    let data;
    try { data = JSON.parse(text); } catch(e) { data = text; }

    res.status(200).json({
      status: response.ok ? "✅ API 호출 성공" : "❌ API 오류",
      httpStatus: response.status,
      response: data,
    });
  } catch (err) {
    res.status(200).json({ status: "❌ 오류", error: err.message });
  }
}
