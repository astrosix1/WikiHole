# WikiHole Production Setup Checklist

**Last Updated:** 2026-06-03  
**Status:** ⚠️ INCOMPLETE — Anthropic key not yet in Vercel

---

## 📋 Pre-Production Requirements

### ✅ Code Changes (Already Done)
- [x] Quiz button wired to `startNewQuiz(currentSessionId)`
- [x] Created `/api/quiz` serverless function (Vercel)
- [x] Verified `api/quiz.js` exports handler
- [x] Updated `vercel.json` with `/api/*` rewrite rules
- [x] Extracted SEED_ARTICLES to `src/data/seeds.js`
- [x] Added `window.storage` localStorage fallback
- [x] Capped `prefetchLinks` at 15 to avoid Wikipedia rate limits
- [x] Added dev-mode bypass in `AccessGate.jsx` (auto-stripped in prod)

### ⏳ Environment Configuration (NEEDED NOW)

**Step 1: Add ANTHROPIC_API_KEY to Vercel**
1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select **WikiHole** project
3. Go to **Settings** → **Environment Variables**
4. Add new variable:
   - **Name:** `ANTHROPIC_API_KEY`
   - **Value:** Your Anthropic API key (from https://console.anthropic.com)
   - **Environments:** Production, Preview, Development (check all)
5. Click **Save**
6. **Redeploy** the project (or wait for next push)

**Step 2: Verify in Vercel Deployment Logs**
1. Go to **Deployments**
2. Click latest deployment
3. Scroll to **Functions** section
4. Check `/api/quiz` deployment logs
5. Should see **no errors** related to missing `ANTHROPIC_API_KEY`

---

## 🧪 Testing in Production

### Test the Quiz Feature End-to-End

1. **Navigate to WikiHole** (production URL, e.g., https://wikihole.asix.live)
2. **Start a rabbit hole:**
   - Pick a starting topic from Discover
   - Follow 3–5 links to build a trail
3. **Open the sidebar:**
   - Verify you can see the trail summary
4. **Click the Quiz button (✦ Quiz):**
   - Wait 2–5 seconds for response
   - Should see generated quiz cards with questions and answers
5. **If Quiz fails:**
   - Check browser console for errors
   - Check Vercel function logs: `https://vercel.com/[team]/wikihole/functions`
   - Common issues:
     - `401 Unauthorized` → API key not set or invalid
     - `timeout` → Anthropic API taking too long
     - `empty response` → Anthropic returned no content

### Test Error Handling

1. **Try with invalid articles:**
   - Click Quiz on a very short trail (< 2 articles)
   - Should gracefully show error message, not crash
2. **Try with slow network:**
   - Open DevTools → Network → "Slow 3G"
   - Click Quiz
   - Should show loading state, not timeout

---

## 🔍 Production Monitoring

### Logs to Watch
- **Vercel Function Logs:** `/api/quiz` errors and response times
- **Anthropic Console:** API usage, rate limits
- **Browser Console (user's machine):** Any client-side errors

### Metrics to Track
- Quiz generation **response time** (should be < 5 seconds)
- **Error rate** (should be < 1%)
- **Anthropic API costs** (monitor usage in console.anthropic.com)

---

## ⚠️ Known Limitations

- Quiz generation depends on Anthropic API availability (subject to outages)
- Free Anthropic accounts may have rate limits
- Each quiz call costs ~1000 tokens (adjust based on your API plan)
- No fallback if Anthropic is down (user gets error)

---

## ✅ Go/No-Go Checklist

Before considering WikiHole ready for production:

- [ ] ANTHROPIC_API_KEY added to Vercel env vars
- [ ] Quiz button generates cards successfully in production
- [ ] Error messages display gracefully (no white screen)
- [ ] Response time < 5 seconds (acceptable latency)
- [ ] Tested on mobile (responsive design holds)
- [ ] Tested on slow network (loading state shows)

---

## 🚀 Deployment Confirmation

Once all above are done:

1. Run: `git log --oneline | head -1` to get latest commit
2. Share with team: "WikiHole Quiz feature now live in production as of [commit hash]"
3. Monitor Vercel logs for the first 24 hours
4. Gather user feedback

---

**Owner:** WikiHole Development  
**Status:** Ready for production setup  
**Next Action:** Add ANTHROPIC_API_KEY to Vercel
