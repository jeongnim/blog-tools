export default async function handler(req, res) {
  const crypto = (await import("crypto")).default;

  const API_KEY     = process.env.NAVER_API_KEY;
  const SECRET_KEY  = process.env.NAVER_SECRET_KEY;
  const CUSTOMER_ID = process.env.NAVER_CUSTOMER_ID;

  const timestamp = Date.now().toString();
  const method = "GET";
  const path = "/keywordstool";

  // 네이버 공식 서명: hmac-sha256(secret, timestamp + "." + method + "." + uri)
  // secret key는 base64 디코딩 없이 그냥 문자열로 사용
  const message = `${timestamp}.${method}.${path}`;
  
  // 방법1: secret 그냥 문자열
  const sig1 = crypto.createHmac("sha256", SECRET_KEY).update(message).digest("base64");
  
  // 방법2: secret을 Buffer로
  const sig2 = crypto.createHmac("sha256", Buffer.from(SECRET_KEY, "utf8")).update(message).digest("base64");
  
  // 방법3: message를 Buffer로
  const sig3 = crypto.createHmac("sha256", SECRET_KEY).update(Buffer.from(message, "utf8")).digest("base64");

  // 각 방법으로 실제 API 호출 테스트
  const test = async (signature, label) => {
    const url = `https://api.naver.com/keywordstool?hintKeywords=${encodeURIComponent("맛집")}&showDetail=1`;
    const r = await fetch(url, { headers: {
      "X-Timestamp": timestamp, "X-API-KEY": API_KEY,
      "X-Customer": CUSTOMER_ID, "X-Signature": signature,
      "Content-Type": "application/json"
    }});
    const data = await r.json();
    return { label, status: r.status, count: data.keywordList?.length, error: data.title };
  };

  const results = await Promise.all([
    test(sig1, "방법1-string"),
    test(sig2, "방법2-buffer"),
    test(sig3, "방법3-msgBuffer"),
  ]);

  res.status(200).json({
    message,
    secretKeyLength: SECRET_KEY?.length,
    secretKeyPrefix: SECRET_KEY?.slice(0,10)+"...",
    results
  });
}
