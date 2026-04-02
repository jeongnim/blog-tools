// pages/api/claude.js
export const config = { maxDuration: 60 };

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "POST만 허용" });

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return res.status(200).json({ content: [] });

  try {
    const body = { ...req.body };
    const useStream = body._stream === true;
    delete body._stream;

    if (useStream) {
      // ── 스트리밍 모드: SSE로 텍스트를 청크 단위 전송 ──
      body.stream = true;
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const errText = await response.text();
        return res.status(200).json({ error: { type: "api_error", message: errText } });
      }

      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let fullText = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split("\n");
        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const data = line.slice(6);
            if (data === "[DONE]") continue;
            try {
              const json = JSON.parse(data);
              if (json.type === "content_block_delta" && json.delta?.text) {
                fullText += json.delta.text;
                res.write(`data: ${JSON.stringify({ text: json.delta.text })}\n\n`);
              }
              if (json.type === "message_stop") {
                res.write(`data: ${JSON.stringify({ done: true, full: fullText })}\n\n`);
              }
            } catch (_) {}
          }
        }
      }
      res.end();

    } else {
      // ── 일반 모드 ──
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify(body),
      });

      const text = await response.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch (_) {
        return res.status(200).json({ error: { type: "parse_error", message: text } });
      }
      res.status(200).json(data);
    }
  } catch (err) {
    res.status(200).json({ error: { type: "server_error", message: err.message } });
  }
}
