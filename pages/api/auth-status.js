// pages/api/auth-status.js
// 페이지 로드 시 세션이 살아있는지 확인 (쿠키는 httpOnly라 브라우저 JS가 직접 못 읽는다)
import { isAuthed } from "../../lib/auth";

export default function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  res.status(200).json({ ok: isAuthed(req) });
}
