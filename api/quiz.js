/**
 * WikiHole Quiz API — Vercel Serverless Function
 *
 * Proxies quiz generation requests to the Anthropic API so the API key
 * stays server-side and never reaches the browser.
 *
 * Set ANTHROPIC_API_KEY in your Vercel project environment variables.
 */

// ── Per-IP rate limiting (in-memory, per serverless instance) ────────────────
// Caps at 10 requests per IP per 60-second window.
// Note: serverless instances are ephemeral — this prevents burst abuse within
// a single warm instance. For cross-instance limits, add Upstash/Redis.
const RATE_LIMIT_MAX = 10;
const RATE_LIMIT_WINDOW_MS = 60_000;
const _rateLimitStore = new Map(); // { ip: { count, windowStart } }

function checkRateLimit(ip) {
  const now = Date.now();
  const entry = _rateLimitStore.get(ip);
  if (!entry || now - entry.windowStart > RATE_LIMIT_WINDOW_MS) {
    _rateLimitStore.set(ip, { count: 1, windowStart: now });
    return true;
  }
  if (entry.count >= RATE_LIMIT_MAX) return false;
  entry.count++;
  return true;
}

// ── Input limits ─────────────────────────────────────────────────────────────
const MAX_ARTICLES       = 5;     // max articles per request
const MAX_EXTRACT_CHARS  = 500;   // max extract length per article (trimmed if over)
const MAX_TITLE_CHARS    = 120;   // max title length per article

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // ── Rate limit ─────────────────────────────────────────────────────────────
  const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || 'unknown';
  if (!checkRateLimit(ip)) {
    return res.status(429).json({ error: 'Too many requests — please wait a moment.' });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(503).json({ error: 'Quiz service not configured' });
  }

  const { articles } = req.body || {};
  if (!Array.isArray(articles) || articles.length === 0) {
    return res.status(400).json({ error: 'articles array is required' });
  }

  // ── Sanitize and cap inputs ────────────────────────────────────────────────
  const safeArticles = articles
    .slice(0, MAX_ARTICLES)
    .map(a => ({
      title:   String(a.title   || '').slice(0, MAX_TITLE_CHARS),
      extract: String(a.extract || '').slice(0, MAX_EXTRACT_CHARS),
    }))
    .filter(a => a.title && a.extract);

  if (safeArticles.length === 0) {
    return res.status(400).json({ error: 'No valid articles after sanitization' });
  }

  const count = Math.min(safeArticles.length * 2, 8);
  const ctx = safeArticles.map(a => `"${a.title}": ${a.extract}`).join('\n\n');

  try {
    const upstream = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 2000,
        system: 'Quiz generator. Return valid JSON array only. No markdown.',
        messages: [{
          role: 'user',
          content: `${count} questions from:\n\n${ctx}\n\nJSON array:[{"question":"...","options":["A) ...","B) ...","C) ...","D) ..."],"answer":"A","explanation":"...","source":"Title"}]`,
        }],
      }),
    });

    if (!upstream.ok) {
      console.error('Anthropic API error:', upstream.status);
      return res.status(502).json({ error: 'Quiz generation failed — try again shortly.' });
    }

    const data = await upstream.json();
    return res.status(200).json(data);
  } catch (err) {
    console.error('Quiz handler error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
