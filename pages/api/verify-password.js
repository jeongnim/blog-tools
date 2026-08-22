// pages/api/verify-password.js
import crypto from "crypto";
import { createSessionToken, sessionCookie, clearSessionCookie } from "../../lib/auth";

// 비밀번호 비교도 타이밍 공격에 안전하게
function safeEqual(a, b) {
  const A = Buffer.from(String(a || ""));
  const B = Buffer.from(String(b || ""));
  if (A.length !== B.length) return false;
  try { return crypto.timingSafeEqual(A, B); } catch (e) { return false; }
}

export default function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "POST만 허용" });

  // 로그아웃
  if (req.body?.action === "logout") {
    res.setHeader("Set-Cookie", clearSessionCookie());
    return res.status(200).json({ ok: true, loggedOut: true });
  }

  const { password } = req.body || {};
  const correct = process.env.SITE_PASSWORD;

  if (!correct) return res.status(500).json({ error: "SITE_PASSWORD 환경변수가 설정되지 않았습니다." });

  if (safeEqual(password, correct)) {
    const token = createSessionToken();
    if (!token) return res.status(500).json({ error: "세션 발급에 실패했습니다." });
    res.setHeader("Set-Cookie", sessionCookie(token));
    return res.status(200).json({ ok: true });
  }

  return res.status(401).json({ ok: false, error: "비밀번호가 틀렸습니다." });
}
