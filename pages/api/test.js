// pages/api/test.js
// 브라우저에서 /api/test 접속하면 Gemini API 상태 확인
export default async function handler(req, res) {
  const apiKey = process.env.GEMINI_API_KEY;
  
  if (!apiKey) {
    return res.status(200).json({ 
      status: "❌ 실패", 
      reason: "GEMINI_API_KEY 환경변수가 없습니다",
      fix: "Vercel → Settings → Environment Variables → GEMINI_API_KEY 추가 후 Redeploy"
    });
  }

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: "say hello in korean" }] }],
          generationConfig: { maxOutputTokens: 50 }
        }),
      }
    );

    const data = await response.json();
    
    if (data.error) {
      return res.status(200).json({
        status: "❌ Gemini 오류",
        error: data.error.message,
        code: data.error.code,
        apiKeyPrefix: apiKey.substring(0, 8) + "..."
      });
    }

    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
    res.status(200).json({
      status: "✅ 정상 작동",
      geminiResponse: text,
      apiKeyPrefix: apiKey.substring(0, 8) + "..."
    });

  } catch (err) {
    res.status(200).json({ 
      status: "❌ 네트워크 오류", 
      error: err.message 
    });
  }
}
