// lib/auth.js
// 서명된 httpOnly 쿠키 기반 세션 인증
//
// 기존 구조의 문제:
//   PasswordGate는 브라우저 안에서만 동작했고, API 라우트에는 인증이 전혀 없었다.
//   화면을 우회할 필요도 없이 /api/claude 를 직접 호출하면 ANTHROPIC_API_KEY가 그대로 쓰였다.
//
// 바뀐 구조:
//   비밀번호가 맞으면 서버가 HMAC 서명된 토큰을 httpOnly 쿠키로 굽고,
//   모든 API 라우트가 첫 줄에서 그 서명을 검증한다. 브라우저 JS로는 위조도 열람도 불가능하다.

import crypto from "crypto";

const COOKIE_NAME = "bp_session";
// 공용 PC에서 쓰므로 브라우저를 닫으면 세션이 끝나야 한다.
// 쿠키에는 Max-Age를 주지 않아(세션 쿠키) 브라우저 종료 시 사라지고,
// 서버 토큰에도 짧은 유효기간을 둬서 창을 계속 열어둬도 무한정 유지되지 않게 한다.
const MAX_AGE = 60 * 60 * 8;   // 토큰 유효기간 8시간

// AUTH_SECRET을 따로 두면 비밀번호를 바꿔도 로그인이 유지된다.
// 없으면 SITE_PASSWORD로 대체 (이 경우 비밀번호 변경 시 전원 재로그인)
function getSecret() {
  return process.env.AUTH_SECRET || process.env.SITE_PASSWORD || "";
}

function sign(value, secret) {
  return crypto.createHmac("sha256", secret).update(String(value)).digest("base64url");
}

export function createSessionToken() {
  const secret = getSecret();
  if (!secret) return null;
  const exp = Date.now() + MAX_AGE * 1000;
  return `${exp}.${sign(exp, secret)}`;
}

export function verifySessionToken(token) {
  const secret = getSecret();
  if (!secret || !token) return false;

  const parts = String(token).split(".");
  if (parts.length !== 2) return false;

  const [exp, sig] = parts;
  if (!/^\d+$/.test(exp)) return false;
  if (Number(exp) < Date.now()) return false;   // 만료

  const expected = sign(exp, secret);
  // 길이가 다르면 timingSafeEqual이 예외를 던지므로 먼저 확인
  if (sig.length !== expected.length) return false;
  try {
    return crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected));
  } catch (e) {
    return false;
  }
}

function parseCookies(req) {
  const raw = req.headers?.cookie || "";
  const out = {};
  raw.split(";").forEach(part => {
    const i = part.indexOf("=");
    if (i === -1) return;
    out[part.slice(0, i).trim()] = decodeURIComponent(part.slice(i + 1).trim());
  });
  return out;
}

export function sessionCookie(token) {
  // Max-Age / Expires 없음 = 세션 쿠키 → 브라우저를 닫으면 사라진다.
  // Secure는 https에서만 유효. Vercel은 항상 https이므로 그대로 둔다.
  return [
    `${COOKIE_NAME}=${token}`,
    "Path=/",
    "HttpOnly",
    "Secure",
    "SameSite=Lax",
  ].join("; ");
}

export function clearSessionCookie() {
  return `${COOKIE_NAME}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`;
}

// 브라우저 세션 쿠키 또는 서버 간 호출용 키를 인정한다.
// API_ACCESS_KEY는 Apps Script·대시보드처럼 쿠키를 쓸 수 없는 곳에서 사용.
export function isAuthed(req) {
  const cookies = parseCookies(req);
  if (verifySessionToken(cookies[COOKIE_NAME])) return true;

  const serverKey = process.env.API_ACCESS_KEY;
  if (serverKey) {
    const given = req.headers?.["x-api-key"] || req.query?.accessKey;
    if (given && String(given) === serverKey) return true;
  }
  return false;
}

// API 라우트 첫 줄에서 호출. false를 돌려주면 이미 401을 보낸 상태이므로 그대로 return 하면 된다.
export function requireAuth(req, res) {
  if (isAuthed(req)) return true;
  res.status(401).json({ error: "인증이 필요합니다.", authRequired: true });
  return false;
}

export const AUTH_COOKIE_NAME = COOKIE_NAME;
