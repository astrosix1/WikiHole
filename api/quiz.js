/**
 * WikiHole Quiz API — Vercel Serverless Function
 *
 * Proxies quiz generation requests to the Anthropic API so the API key
 * stays server-side and never reaches the browser.
 *
 * Set ANTHROPIC_API_KEY in your Vercel project environment variables.
 */
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(503).json({ error: 'Quiz service not configured (missing ANTHROPIC_API_KEY)' });
  }

  const { articles } = req.body || {};
  if (!Array.isArray(articles) || articles.length === 0) {
    return res.status(400).json({ error: 'articles array is required' });
  }

  const count = Math.min(articles.length * 2, 8);
  const ctx = articles.map(a => `"${a.title}": ${a.extract}`).join('\n\n');

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
      const errText = await upstream.text();
      console.error('Anthropic API error:', upstream.status, errText);
      return res.status(502).json({ error: `Upstream error ${upstream.status}` });
    }

    const data = await upstream.json();
    return res.status(200).json(data);
  } catch (err) {
    console.error('Quiz handler error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
