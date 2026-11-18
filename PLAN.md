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
- Postgres database (provider: TBD) — family accounts, parent/athlete roles
- **Claude API** coach — per-person system prompts with guardrails; fast model for logging/nudges, stronger model for programs/chat; in-app usage/cost meter (budget TBD)
- Vercel Cron — morning plans, evening nudges
- Accounts already in place: Vercel, database, Claude API key

## Build order
1. **v1 — Today's plan:** login, onboarding chat (collects stats, schedule, goals; Maicie's baseline tests), program generation, today's plan with checkboxes, daily check-in.
2. **v2:** coach chat (text/voice) with auto-logging, morning/evening push notifications, pain alert to Mike.
3. **v3:** test results & progress charts, Apple Health Shortcut, 4-week rebalancing.
4. **Later:** photo food logging, more family members.
