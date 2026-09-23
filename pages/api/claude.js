// pages/api/claude.js
import { requireAuth } from "../../lib/auth";

// 긴 본문 생성은 60초를 넘길 수 있다. Pro 플랜에서 300초까지 허용된다.
// (Hobby 플랜이면 Vercel이 알아서 60초로 깎으므로 값을 올려둬도 무해하다)
// 방문 리뷰의 사진(최대 10장)이 요청에 실려 오므로 본문 한도를 늘린다. Next 기본값 1MB, Vercel 상한 4.5MB.
export const config = { maxDuration: 300, api: { bodyParser: { sizeLimit: "4.4mb" } } };

// ═══ 보안 1단계: 이 사이트가 실제로 쓰는 형태의 요청만 Anthropic으로 넘긴다 ═══
// 로그인만 하면 F12 콘솔에서 아무 요청이나 만들어 크레딧을 쓸 수 있던 구멍을 좁힌다.
// (사람별 사용량 제한은 계정이 생기는 3단계에서. 아래 횟수 제한은 서버 인스턴스별 임시 방어선이다.)
const ALLOWED_MODELS = new Set(["claude-haiku-4-5-20251001", "claude-sonnet-4-5-20250929"]);
const ALLOWED_KEYS = new Set(["model", "max_tokens", "messages", "system", "stream", "tools", "tool_choice"]);
const MAX_TOKENS_CAP = 8000;      // 사이트 최대 사용 7000 (본문 작성)
const MAX_SEARCHES_CAP = 10;      // 사이트 최대 사용 10 (수치 확인)
const MAX_MESSAGES = 4;
const MAX_IMAGES = 10;            // 방문 리뷰 사진
const MAX_SYSTEM_CHARS = 20000;
const MAX_TEXT_CHARS = 120000;    // 프롬프트 글자 수 합계 (사이트 최대 프롬프트의 넉넉한 2배 수준)

function validateRequest(b) {
  if (!b || typeof b !== "object") return "요청 형식 오류";
  for (const k of Object.keys(b)) if (!ALLOWED_KEYS.has(k)) return `허용되지 않은 항목: ${k}`;
  if (!ALLOWED_MODELS.has(b.model)) return `허용되지 않은 모델: ${b.model}`;
  if (!Number.isInteger(b.max_tokens) || b.max_tokens < 1 || b.max_tokens > MAX_TOKENS_CAP) return `max_tokens는 1~${MAX_TOKENS_CAP}`;
  if (b.stream !== undefined && typeof b.stream !== "boolean") return "stream 형식 오류";
  if (b.system !== undefined && (typeof b.system !== "string" || b.system.length > MAX_SYSTEM_CHARS)) return "system 형식 오류";

  if (!Array.isArray(b.messages) || b.messages.length < 1 || b.messages.length > MAX_MESSAGES) return "messages 개수 오류";
  let textChars = 0, images = 0;
  for (const m of b.messages) {
    if (!m || (m.role !== "user" && m.role !== "assistant")) return "messages 역할 오류";
    const blocks = typeof m.content === "string" ? [{ type: "text", text: m.content }] : m.content;
    if (!Array.isArray(blocks)) return "messages 내용 오류";
    for (const c of blocks) {
      if (c?.type === "text" && typeof c.text === "string") { textChars += c.text.length; continue; }
      if (c?.type === "image" && m.role === "user" && c.source?.type === "base64"
          && /^image\/(jpeg|png|webp|gif)$/.test(c.source.media_type || "") && typeof c.source.data === "string") { images++; continue; }
      return `허용되지 않은 내용 형식: ${c?.type}`;
    }
  }
  if (images > MAX_IMAGES) return `사진은 최대 ${MAX_IMAGES}장`;
  if (textChars > MAX_TEXT_CHARS) return "프롬프트가 너무 깁니다";

  // 도구: 웹 검색(횟수 상한) 또는 구조화 결과용 "report" 도구만
  if (b.tools !== undefined) {
    if (!Array.isArray(b.tools) || b.tools.length !== 1) return "tools 형식 오류";
    const t = b.tools[0];
    const isSearch = t?.type === "web_search_20250305" && t.name === "web_search"
      && Number.isInteger(t.max_uses) && t.max_uses >= 1 && t.max_uses <= MAX_SEARCHES_CAP
      && Object.keys(t).every(k => ["type", "name", "max_uses"].includes(k));
    const isReport = t?.name === "report" && !t.type && t.input_schema?.type === "object"
      && Object.keys(t).every(k => ["name", "description", "input_schema"].includes(k));
    if (!isSearch && !isReport) return "허용되지 않은 도구";
    if (b.tool_choice !== undefined) {
      const ok = isReport && b.tool_choice?.type === "tool" && b.tool_choice?.name === "report";
      if (!ok) return "tool_choice 형식 오류";
    }
  } else if (b.tool_choice !== undefined) return "tool_choice 형식 오류";
  return null;
}

// 임시 횟수 제한: IP당 10분에 150회 (글 1편에 5~10회 호출). 서버 인스턴스마다 따로 센다.
const RATE_WINDOW_MS = 10 * 60 * 1000, RATE_MAX = 150;
const hits = new Map();
function rateLimited(req) {
  const ip = String(req.headers["x-forwarded-for"] || req.socket?.remoteAddress || "?").split(",")[0].trim();
  const now = Date.now();
  const arr = (hits.get(ip) || []).filter(t => now - t < RATE_WINDOW_MS);
  arr.push(now); hits.set(ip, arr);
  if (hits.size > 5000) for (const [k, v] of hits) if (!v.length || now - v[v.length - 1] > RATE_WINDOW_MS) hits.delete(k);
  return arr.length > RATE_MAX;
}

export default async function handler(req, res) {
  if (!requireAuth(req, res)) return;

  if (req.method !== "POST") return res.status(405).json({ error: "POST만 허용" });

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return res.status(200).json({ content: [] });

  const invalid = validateRequest(req.body);
  if (invalid) return res.status(400).json({ error: { type: "invalid_request", message: "허용되지 않은 요청입니다 (" + invalid + ")" } });
  if (rateLimited(req)) return res.status(429).json({ error: { type: "rate_limited", message: "요청이 너무 많습니다. 몇 분 뒤 다시 시도해주세요." } });

  const wantsStream = req.body?.stream === true;

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify(req.body),
    });

    // ── 스트리밍: 받은 SSE를 그대로 흘려보낸다 ──
    // 토큰이 나오는 즉시 전달되므로 중간에 끊겨도 이미 받은 부분은 살릴 수 있다.
    if (wantsStream) {
      if (!response.ok || !response.body) {
        const text = await response.text();
        return res.status(200).json({
          error: { type: "api_error", message: text.slice(0, 500) },
        });
      }

      res.setHeader("Content-Type", "text/event-stream; charset=utf-8");
      res.setHeader("Cache-Control", "no-cache, no-transform");
      res.setHeader("Connection", "keep-alive");
      res.setHeader("X-Accel-Buffering", "no");

      const reader = response.body.getReader();
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          res.write(Buffer.from(value));
        }
      } catch (e) {
        res.write(`event: error\ndata: ${JSON.stringify({ message: e.message })}\n\n`);
      }
      return res.end();
    }

    // ── 비스트리밍(기존 경로) ──
    const text = await response.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch (_) {
      return res.status(200).json({ error: { type: "parse_error", message: text.slice(0, 500) } });
    }

    res.status(200).json(data);
  } catch (err) {
    res.status(200).json({ error: { type: "server_error", message: err.message } });
  }
}
