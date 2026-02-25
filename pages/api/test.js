export default async function handler(req, res) {
  const crypto = (await import("crypto")).default;
  const keyword = req.query.keyword || "kt올레";

  const API_KEY     = process.env.NAVER_API_KEY;
  const SECRET_KEY  = process.env.NAVER_SECRET_KEY;
  const CUSTOMER_ID = process.env.NAVER_CUSTOMER_ID;

  if (!API_KEY) return res.status(200).json({ error: "NAVER_API_KEY 없음" });

  const timestamp = Date.now().toString();
  const message = `${timestamp}.GET./keywordstool`;
  const signature = crypto.createHmac("sha256", SECRET_KEY).update(message).digest("base64");
  const apiUrl = `https://api.naver.com/keywordstool?hintKeywords=${encodeURIComponent(keyword)}&showDetail=1`;

  const response = await fetch(apiUrl, {
    headers: {
      "X-Timestamp": timestamp,
      "X-API-KEY": API_KEY,
      "X-Customer": CUSTOMER_ID,
      "X-Signature": signature,
    },
  });

  const data = await response.json();
  const list = data.keywordList || [];

  // 대소문자 무시 매칭 테스트
  const exact = list.find(i => i.relKeyword?.toLowerCase() === keyword.toLowerCase());
  const first = list[0];

  res.status(200).json({
    query: keyword,
    totalResults: list.length,
    firstItem: first,
    exactMatch: exact,
    allKeywords: list.map(i => i.relKeyword),
    rawPcQcCnt: exact?.monthlyPcQcCnt ?? first?.monthlyPcQcCnt,
    rawMobileQcCnt: exact?.monthlyMobileQcCnt ?? first?.monthlyMobileQcCnt,
  });
}
