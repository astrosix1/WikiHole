import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [
    react(),
    // ── Dev-only API mock ────────────────────────────────────────────────────
    // In production, /api/quiz is a Vercel serverless function.
    // In dev (npm run dev), Vite serves it through this middleware so the
    // quiz error flow can be tested without needing the Vercel runtime.
    {
      name: 'dev-api-mock',
      apply: 'serve', // only active during dev, stripped from production build
      configureServer(server) {
        server.middlewares.use('/api/quiz', (req, res) => {
          res.statusCode = 503;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({
            error: 'Quiz service not configured — add ANTHROPIC_API_KEY in Vercel to enable.',
          }));
        });
      },
    },
  ],
  server: { port: 5173 },
});
