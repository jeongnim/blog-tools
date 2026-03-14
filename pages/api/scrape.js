// pages/api/scrape.js
// URL을 받아서 기사 텍스트 + 이미지 URL 목록을 추출합니다

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { url } = req.body;
  if (!url) return res.status(400).json({ error: 'URL이 필요합니다' });

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'ko-KR,ko;q=0.9,en-US;q=0.8',
      },
      // Vercel 타임아웃 대비
      signal: AbortSignal.timeout(8000),
    });

    if (!response.ok) throw new Error(`페이지를 불러올 수 없습니다 (HTTP ${response.status})`);

    const html = await response.text();
    const title = extractTitle(html);
    const text = extractText(html);
    const images = extractImages(html, url);

    return res.status(200).json({ success: true, data: { title, text, images, sourceUrl: url } });
  } catch (error) {
    console.error('Scrape error:', error);
    return res.status(500).json({ error: error.message || '스크래핑 중 오류가 발생했습니다' });
  }
}

// ── 제목 추출 ────────────────────────────────────────────────────────────
function extractTitle(html) {
  const ogTitle = html.match(/<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["']/i)
                || html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:title["']/i);
  if (ogTitle) return decode(ogTitle[1].trim());

  const titleTag = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  if (titleTag) return decode(titleTag[1].trim());

  const h1 = html.match(/<h1[^>]*>([^<]+)<\/h1>/i);
  if (h1) return decode(h1[1].trim());

  return '제목 없음';
}

// ── 본문 텍스트 추출 ──────────────────────────────────────────────────────
function extractText(html) {
  // 불필요한 태그 제거
  let cleaned = html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi, '')
    .replace(/<header[^>]*>[\s\S]*?<\/header>/gi, '')
    .replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi, '')
    .replace(/<aside[^>]*>[\s\S]*?<\/aside>/gi, '')
    .replace(/<figure[^>]*>[\s\S]*?<\/figure>/gi, '')
    .replace(/<!--[\s\S]*?-->/g, '');

  // article / main 본문 우선 추출
  const articleMatch = cleaned.match(/<article[^>]*>([\s\S]*?)<\/article>/i)
    || cleaned.match(/<main[^>]*>([\s\S]*?)<\/main>/i)
    || cleaned.match(/<div[^>]+(?:class|id)=["'][^"']*(?:content|article|body|post)[^"']*["'][^>]*>([\s\S]*?)<\/div>/i);

  const target = articleMatch ? articleMatch[1] : cleaned;

  // 태그 제거 후 텍스트 정리
  const text = target
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<\/div>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/[ \t]{2,}/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  return text.slice(0, 5000); // 최대 5000자
}

// ── 이미지 URL 추출 ───────────────────────────────────────────────────────
function extractImages(html, baseUrl) {
  const base = new URL(baseUrl);
  const seen = new Set();
  const results = [];

  // og:image 우선
  const ogImg = html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i)
              || html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i);
  if (ogImg) {
    const src = toAbsUrl(ogImg[1], base);
    if (src && !seen.has(src)) { seen.add(src); results.push(src); }
  }

  // img 태그 src / data-src
  const imgRegex = /<img[^>]+(?:src|data-src|data-lazy-src)=["']([^"']+)["'][^>]*>/gi;
  let m;
  while ((m = imgRegex.exec(html)) !== null) {
    if (results.length >= 15) break;
    const src = toAbsUrl(m[1], base);
    if (!src || seen.has(src)) continue;
    // 작은 아이콘·광고 이미지 제외 (w/h 힌트가 있는 경우)
    if (/[?&](w|width)=([1-9][0-9]|[1-9])(&|$)/i.test(src)) continue;
    if (/\/(icon|logo|ad|banner|pixel|spacer|blank)\./i.test(src)) continue;
    seen.add(src); results.push(src);
  }

  return results;
}

function toAbsUrl(src, base) {
  if (!src || src.startsWith('data:') || src.startsWith('blob:')) return null;
  try {
    return new URL(src, base).href;
  } catch { return null; }
}

function decode(str) {
  return str
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&nbsp;/g, ' ');
}
