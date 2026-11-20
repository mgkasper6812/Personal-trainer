# Family Trainer — Plan

An AI-coached training app for Mike (weight loss) and Maicie (softball off-season), hosted on Vercel.

## Purpose
- **No more guessing** — open the app and know exactly what to do today.
- **Visible progress** — see proof it's working.

## Core model
Each person has a **multi-week program designed up front**; the **AI coach adjusts each day** for sleep, soreness, missed days, and schedule. Coach style: **direct** for both.

## Users & roles
- Family app (room to add members later).
- **Mike** — parent role. Private data. Can see Maicie's plan, progress, and coach chats.
- **Maicie** — athlete role, own login on her own phone. Cannot see Mike's data.
- Both on iPhone (home-screen web app).

## Maicie — off-season (CF, class of 2028)
- **Goal:** hitting is #1, with real focus on **strength** and **quickness**. Coach decides the balance from test results.
- **Timeline:** late Nov → June, peaking for **summer travel / showcases**. No HS season. 4-week blocks.
- **Availability:** 4–5 days/week, ~60 min. Has home tee/net, cage/machine access, bat sensor/radar, gym.
- **Testing:** baseline at onboarding, **retest every 4 weeks**, coach rebalances each block.
  - Hitting: bat speed + exit velo (tee and front toss)
  - Speed: 10-yd split, home-to-first, 60-yd
  - Agility / jumps: 5-10-5, broad jump, vertical
  - Strength: estimated maxes, push-ups/chin-ups, rotational med-ball throw
- **Quickness focus:** CF first step / jumps, home-to-first & base running, agility / change of direction.
- **Hitting lessons:** she logs cues/drills after each lesson; AI reinforces them and never contradicts her coach's mechanics.
- **Guardrails:** no dieting/weight-loss talk (fueling for performance only). Any pain → stop that activity and notify Mike.

## Mike — weight loss
- **Main obstacle:** food / evenings.
- **Training:** short home workouts and walks (20–40 min).
- **Coach:** morning plan (incl. dinner/evening snack), evening nudge, on-call anytime.
- **Data:** Apple Watch + smart scale via Apple Health → iOS Shortcut → app webhook.

## Input methods (over time)
Quick check-in, natural-language chat (text/voice), detailed logging, device data.

## Tech
- Next.js on **Vercel** (installable PWA, web push on iOS 16.4+ from home screen)
- **Upstash Redis** (same as the Twitter app) for all data; **Vercel Blob** later for photos/files. Family accounts with parent/athlete roles
- **Claude API** coach — per-person system prompts with guardrails; fast model for logging/nudges, stronger model for programs/chat; in-app usage/cost meter (budget TBD)
- Vercel Cron — morning plans, evening nudges
- Accounts already in place: Vercel, database, Claude API key

## Build order (revised after competitive research — see reports/Fitness coaching app teardown.md)

### Phase 1 — rebuild (in progress)
- **Tap-first onboarding** (~10 screens each, chips/steppers/pickers, ≤3 optional text boxes). Dad's flow includes health
  context (prediabetes/insulin resistance, meds), toughest time of day, evening snacks and an if-then evening plan.
  Maicie's flow starts with what Dad can see, then profile, priorities, schedule, gear, lifting background, starting numbers,
  hitting-coach cues and a body check.
- **AI-built program as Hevy-style routines**: one routine per training day, exercises from a built-in library,
  target sets/reps/weight/rest. Editable.
- **Hevy-style workout logger**: previous values inline and pre-filled, one-tap set completion, set types (warm-up, normal,
  drop, failure), RPE, rest timer stored as an end time, supersets, notes, add/swap exercises, finish summary with PRs.
  Hitting (swings + bat speed/exit velo), sprints (time + method) and throws are first-class exercise types.
- **History & progress**: workout history, per-exercise charts (est. 1RM, best set, volume, top bat speed), PRs.
- **Today**: 30-second check-in with a separate pain question (area, 0–10, sharp/achy, with throwing); a rule engine
  adjusts today's routine and explains why. Dad's **Tonight** card (kitchen-closed time, planned swap, one-tap evening log).
- **Condition-aware coaching** for Dad (DPP-style 5–7% goal, post-meal walks, 2–3x/wk strength, 150 min/wk, carb quality,
  if-then snack plans; doctor leads on A1C/meds). Performance-only fueling for Maicie; no weight anywhere on her account.
- **Parent view**: Maicie's status (green/amber/red), completed workouts, test results, pain alerts. Her free-text notes stay private.
- **Apple Watch**: record the workout on the Watch; a one-tap iOS Shortcut sends heart rate, calories and duration from
  Apple Health into the app and attaches them to the logged workout.

### Phase 2
Weight trend from Health sync + Sunday check-in for Dad; 4-week test scorecards for Maicie; consistency calendar with grace
days; session RPE / throw-count load view; morning + pre-TV push notifications; coach chat.

### Phase 3
Photo/text food logging, Blast CSV import, glucose import, weekly lessons, swing video, family cheers.
