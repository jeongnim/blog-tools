export default async function handler(req, res) {
  const key = process.env.NAVER_API_KEY;
  const secret = process.env.NAVER_SECRET_KEY;
  const customer = process.env.NAVER_CUSTOMER_ID;
  res.status(200).json({
    NAVER_API_KEY: key ? key.substring(0,10)+"..." : "❌ 없음",
    NAVER_SECRET_KEY: secret ? secret.substring(0,10)+"..." : "❌ 없음",
    NAVER_CUSTOMER_ID: customer || "❌ 없음",
  });
}
