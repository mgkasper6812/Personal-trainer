# Family Trainer

AI-coached training for Dad (weight loss) and Maicie (softball off-season). See [PLAN.md](PLAN.md) for the full plan.

**What it does:** tap-first setup for each person → an AI-built 4-week program of Hevy-style routines → a live
workout logger (previous values, set types, rest timer, supersets, PRs, per-exercise charts) → a 30-second daily check-in
whose pain/readiness rules adjust the day's session and alert the parent. Dad gets condition-aware guidance
(prediabetes / insulin resistance) and a nightly "Tonight" plan; Maicie gets hitting, speed, throwing and test tracking
with performance-only fueling. Apple Watch heart rate and calories sync through an iPhone Shortcut (Settings → Apple Watch sync).

Stack: Next.js on Vercel · Upstash Redis · Claude API (`claude-opus-5-5`, with server-side refusal fallback).

## Deploy to Vercel

1. In Vercel: **Add New → Project**, import `mgkasper6812/Personal-trainer`, choose this branch (or `main` once merged).
2. **Storage → Upstash for Redis**: connect a database to the project — your existing one is fine. All of this app's keys start with `ft:`, so they never collide with another app's data. This sets `KV_REST_API_URL` and `KV_REST_API_TOKEN`.
3. **Settings → Environment Variables**, add:
   - `ANTHROPIC_API_KEY` — from console.anthropic.com
   - `SESSION_SECRET` — any long random string (e.g. run `openssl rand -base64 32`)
4. Deploy. Open the site on your iPhone in Safari, create the parent account, then **Family → Add a family member** for Maicie.
5. On each iPhone: Share → **Add to Home Screen**.

## Run locally

```bash
npm install
cp .env.example .env.local   # fill in values, or set COACH_MOCK=1 to try it with canned coach answers
npm run dev
```

Without Redis credentials, local dev stores data in memory (lost on restart).

## Where things live

- `lib/prompts.ts` — coach instructions and Maicie's guardrails (no dieting talk; pain = stop + tell Dad; her hitting coach owns mechanics)
- `lib/schemas.ts` — the structured shapes the coach returns (profile, program, daily plan)
- `lib/coach.ts` — Claude API calls, refusal fallback, cost tracking
- `app/api/*` — server routes · `components/*` — screens
