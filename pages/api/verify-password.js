// pages/api/verify-password.js
export default function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "POST만 허용" });

  const { password } = req.body;
  const correct = process.env.SITE_PASSWORD;

  if (!correct) return res.status(500).json({ error: "SITE_PASSWORD 환경변수가 설정되지 않았습니다." });
  if (password === correct) return res.status(200).json({ ok: true });
  return res.status(401).json({ ok: false, error: "비밀번호가 틀렸습니다." });
}
