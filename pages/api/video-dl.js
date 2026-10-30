// pages/api/video-dl.js — 동영상 다운로드 허가(1회용 서명) 발급
// 실제 다운로드는 이 사이트에 연결된 PC(집/회사)의 dl_server.py 가 하고, 브라우저가 그 PC에서 바로 받는다.
// Vercel 환경변수: DL_PROXY_URL (예: https://내pc.xxxx.ts.net/dl), DL_SECRET (PC의 dl_config.json secret 과 같은 값)
import crypto from "crypto";
import { requireAuth } from "../../lib/auth";

const ALLOWED = /(^|\.)(youtube\.com|youtu\.be|tiktok\.com)$/i;
const QUALITY = new Set(["best", "720", "audio"]);

export default async function handler(req, res) {
  if (!requireAuth(req, res)) return;
  if (req.method !== "POST") return res.status(405).json({ error: "POST만 허용" });
  const base = String(process.env.DL_PROXY_URL || "").replace(/\/+$/, "");
  const secret = process.env.DL_SECRET || "";
  const { action, url, quality } = req.body || {};
  if (action === "info") return res.status(200).json({ base, configured: !!(base && secret) });
  if (action !== "sign") return res.status(400).json({ error: "알 수 없는 action" });
  if (!base || !secret) return res.status(200).json({ error: "Vercel 환경변수 DL_PROXY_URL · DL_SECRET 이 없어요" });

  let u;
  try { u = new URL(String(url || "").trim()); } catch (e) { return res.status(200).json({ error: "주소 형식이 아니에요" }); }
  if (!/^https?:$/.test(u.protocol) || !ALLOWED.test(u.hostname)) return res.status(200).json({ error: "유튜브·틱톡 주소만 받을 수 있어요" });
  const q = QUALITY.has(quality) ? quality : "best";
  const exp = Math.floor(Date.now() / 1000) + 600;            // 10분짜리 허가
  const link = u.toString();
  const sig = crypto.createHmac("sha256", secret).update(`${link}|${q}|${exp}`).digest("hex");
  return res.status(200).json({ base, u: link, q, exp, sig });
}
