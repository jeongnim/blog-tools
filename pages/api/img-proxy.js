// pages/api/img-proxy.js
// 외부 이미지를 서버 사이드에서 가져와서 클라이언트에 전달 (CORS 우회)

export default async function handler(req, res) {
  const { url } = req.query;

  if (!url) return res.status(400).send('URL 파라미터 필요');

  // 허용 도메인 제한 없이 일반 이미지만 허용 (data:, blob: 차단)
  if (url.startsWith('data:') || url.startsWith('blob:')) {
    return res.status(400).send('지원하지 않는 URL 형식');
  }

  try {
    const imgRes = await fetch(decodeURIComponent(url), {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'image/webp,image/apng,image/*,*/*;q=0.8',
        'Referer': new URL(decodeURIComponent(url)).origin,
      },
      signal: AbortSignal.timeout(6000),
    });

    if (!imgRes.ok) return res.status(imgRes.status).send('이미지 불러오기 실패');

    const contentType = imgRes.headers.get('content-type') || 'image/jpeg';
    if (!contentType.startsWith('image/')) return res.status(400).send('이미지가 아닙니다');

    const buffer = await imgRes.arrayBuffer();

    res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', 'public, max-age=3600');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.send(Buffer.from(buffer));
  } catch (err) {
    res.status(500).send('이미지 프록시 오류: ' + err.message);
  }
}
