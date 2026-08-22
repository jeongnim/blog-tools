// pages/api/claude.js
import { requireAuth } from "../../lib/auth";

// 긴 본문 생성은 60초를 넘길 수 있다. Pro 플랜에서 300초까지 허용된다.
// (Hobby 플랜이면 Vercel이 알아서 60초로 깎으므로 값을 올려둬도 무해하다)
export const config = { maxDuration: 300 };

export default async function handler(req, res) {
  if (!requireAuth(req, res)) return;

  if (req.method !== "POST") return res.status(405).json({ error: "POST만 허용" });

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return res.status(200).json({ content: [] });

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
