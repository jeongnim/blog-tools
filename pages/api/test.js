export default async function handler(req, res) {
  const crypto = (await import("crypto")).default;

  const API_KEY     = process.env.NAVER_API_KEY;
  const SECRET_KEY  = process.env.NAVER_SECRET_KEY;
  const CUSTOMER_ID = process.env.NAVER_CUSTOMER_ID;

  if (!API_KEY) return res.status(200).json({ error: "NAVER_API_KEY 없음" });

  // 여러 키워드로 테스트
  const tests = ["맛집", "kt올레", "KT올레", "다이어트"];
  const results = {};

  for (const keyword of tests) {
    const timestamp = Date.now().toString();
    const message = `${timestamp}.GET./keywordstool`;
    const signature = crypto.createHmac("sha256", SECRET_KEY).update(message).digest("base64");
    const encoded = encodeURIComponent(keyword);
    const apiUrl = `https://api.naver.com/keywordstool?hintKeywords=${encoded}&showDetail=1`;

    try {
      const response = await fetch(apiUrl, {
        headers: {
          "X-Timestamp": timestamp,
          "X-API-KEY": API_KEY,
          "X-Customer": CUSTOMER_ID,
          "X-Signature": signature,
          "Content-Type": "application/json",
        },
      });
      const raw = await response.text();
      let data;
      try { data = JSON.parse(raw); } catch(e) { data = { parseError: raw.slice(0,200) }; }
      results[keyword] = {
        status: response.status,
        count: data.keywordList?.length ?? "N/A",
        first: data.keywordList?.[0] ?? data.message ?? data.parseError ?? data
      };
    } catch(e) {
      results[keyword] = { error: e.message };
    }
    await new Promise(r => setTimeout(r, 200));
  }

  res.status(200).json(results);
}
