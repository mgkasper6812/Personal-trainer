# Family Trainer

A simple phone-friendly app with two sides:

- **Me** — weight loss: calorie & protein targets (Mifflin-St Jeor), daily log (weight, calories, protein, steps, water, sleep), 7-day-average weight trend chart, projected goal date, and a 3-day strength + cardio weekly plan with checkboxes.
- **Maicie** — 12-week softball off-season program (Foundation → Strength → Power & Speed → Pre-season, deload in week 7). Daily sessions with phase-specific sets/reps for lifting, speed, throwing (long-toss progression), hitting, and position footwork (CF by default; infield/catcher options). Includes a readiness check-in (sleep, soreness, arm feel, energy) that adjusts the day's advice, a 12-week completion calendar, and benchmark tracking (60-yd, home-to-first, 5-10-5, broad jump, throw velo, exit velo, deadlift).

No accounts, no server: data is stored in the browser on your phone. Use **Settings → Export backup** to save it.

## Run it

Open `index.html` in a browser, or serve the folder:

```
python3 -m http.server 8000
```

To use it on a phone, publish with GitHub Pages (repo Settings → Pages → deploy from this branch, root folder), open the URL, then **Add to Home Screen**.

## Customize

All workouts live in `data.js` — edit exercises, sets/reps per phase, or the weekly schedule there.

> General fitness guidance, not medical advice. Check with a doctor before starting, and coordinate Maicie's throwing volume with her coaches.
