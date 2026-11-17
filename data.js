// Program content. Edit this file to change workouts.

// ---------------- Weight loss: weekly plan (0 = Sunday) ----------------
const ME_WEEK = {
  0: { title: "Rest + mobility", type: "rest", items: [
    "10 min easy stretching (hips, hamstrings, chest)",
    "Plan & prep food for the week",
    "Hit your step goal",
  ]},
  1: { title: "Strength A", type: "strength", items: [
    "Warm-up: 5 min walk/bike + 10 bodyweight squats",
    "Goblet squat — 3 × 8–12",
    "Dumbbell bench press — 3 × 8–12",
    "One-arm dumbbell row — 3 × 10 / side",
    "Romanian deadlift (DB) — 3 × 10",
    "Plank — 3 × 30–45 s",
  ]},
  2: { title: "Cardio — brisk walk", type: "cardio", items: [
    "Brisk walk 30–45 min (able to talk, not sing)",
    "Hit your step goal",
  ]},
  3: { title: "Strength B", type: "strength", items: [
    "Warm-up: 5 min walk/bike + band pull-aparts",
    "Split squat or leg press — 3 × 10 / side",
    "Lat pulldown or assisted pull-up — 3 × 10",
    "Overhead dumbbell press — 3 × 8–10",
    "Hip thrust or glute bridge — 3 × 12",
    "Farmer carry — 4 × 40 yd",
  ]},
  4: { title: "Cardio — intervals", type: "cardio", items: [
    "Bike, incline walk, or rower: 5 min easy",
    "8 rounds: 30 s hard / 90 s easy",
    "5 min easy cool-down",
  ]},
  5: { title: "Strength A", type: "strength", items: [
    "Warm-up: 5 min walk/bike + 10 bodyweight squats",
    "Goblet squat — 3 × 8–12",
    "Dumbbell bench press — 3 × 8–12",
    "One-arm dumbbell row — 3 × 10 / side",
    "Romanian deadlift (DB) — 3 × 10",
    "Side plank — 3 × 20–30 s / side",
  ]},
  6: { title: "Long walk / active day", type: "cardio", items: [
    "60 min walk, hike, or bike — or go throw/hit with Maicie",
    "Hit your step goal",
  ]},
};

const ME_RULES = [
  "Protein at every meal (palm-sized portion or more).",
  "Half the plate vegetables at lunch and dinner.",
  "Log everything you eat — even the bad days.",
  "Weigh in every morning after the bathroom, before eating.",
  "Strength: when you hit the top of the rep range on all sets, add weight next time.",
  "Limit liquid calories (soda, juice, alcohol).",
];

// ---------------- Softball off-season (12 weeks) ----------------
// Phase by week number (1-based).
const PHASES = [
  { key: "F",   name: "Foundation",  weeks: [1, 2, 3],      color: "#0ea5e9",
    goal: "Rebuild movement quality, tissue capacity, and an aerobic base. Ramp the arm back up gradually after fall ball." },
  { key: "S",   name: "Strength",    weeks: [4, 5, 6, 7],   color: "#8b5cf6",
    goal: "Get strong — heavier main lifts, longer long toss, more hitting volume. Week 7 is a lighter deload week." },
  { key: "P",   name: "Power & Speed", weeks: [8, 9, 10],   color: "#f97316",
    goal: "Turn strength into speed: jumps, sprints, med-ball throws, max-intent swings and pull-downs." },
  { key: "Pre", name: "Pre-season",  weeks: [11, 12],       color: "#16a34a",
    goal: "Sharpen. Less lifting volume, game-speed throws and live at-bats. Arrive at tryouts fresh." },
];
const DELOAD_WEEKS = [7];

// Each exercise: [name, {F, S, P, Pre} prescriptions]. A missing phase = skip that exercise in that phase.
const R = (F, S, P, Pre) => ({ F, S, P, Pre });

const MC_WEEK = {
  1: { title: "Lower-body strength + acceleration", minutes: 75, blocks: [
    { name: "Warm-up", items: [
      ["Dynamic warm-up (skips, lunges w/ reach, leg swings, A-skips)", R("10 min","10 min","10 min","10 min")],
    ]},
    { name: "Speed", items: [
      ["Falling starts / 10-yd sprints (full rest)", R("6 × 10 yd","8 × 10 yd","6 × 20 yd","4 × 20 yd")],
      ["Broad jump (stick landing)", R("3 × 3","4 × 3","4 × 3","3 × 2")],
    ]},
    { name: "Strength", items: [
      ["Trap-bar deadlift (or KB deadlift)", R("3 × 8","4 × 5","4 × 3 fast","3 × 3")],
      ["Rear-foot-elevated split squat", R("3 × 8 / leg","4 × 6 / leg","3 × 5 / leg","2 × 5 / leg")],
      ["Single-leg RDL", R("3 × 8 / leg","3 × 8 / leg","3 × 6 / leg","2 × 6 / leg")],
      ["Copenhagen side plank", R("2 × 15 s / side","3 × 20 s / side","3 × 20 s / side","2 × 20 s / side")],
      ["Pallof press", R("3 × 10 / side","3 × 10 / side","3 × 8 / side","2 × 8 / side")],
    ]},
  ]},
  2: { title: "Throwing + hitting + upper body", minutes: 90, blocks: [
    { name: "Arm care", items: [
      ["J-band / band routine (ER, IR, Ys, Ts, 90/90)", R("1 round","1 round","1 round","1 round")],
    ]},
    { name: "Throwing", items: [
      ["Long toss — stretch out on an arc, then pull down", R("build to 90–120 ft","build to 150 ft","build to 180–200 ft + pull-downs","150 ft + on-line throws")],
      ["Crow-hop throws to a target (OF)", R("—","10 throws","12 throws","15 throws to bases")],
    ]},
    { name: "Hitting", items: [
      ["Tee work (one focus cue per round)", R("40 swings","50 swings","40 swings","30 swings")],
      ["Front toss / machine", R("40 swings","50 swings","40 max-intent","Live BP / machine at game speed")],
      ["Over/under-load bat swings", R("—","3 × 5 each","3 × 5 each","2 × 5 each")],
    ]},
    { name: "Upper strength", items: [
      ["Push-up or DB bench press", R("3 × 10","4 × 6–8","3 × 5","2 × 6")],
      ["Chin-up / inverted row", R("3 × 8","4 × 6–8","3 × 6","2 × 6")],
      ["Half-kneeling landmine press", R("3 × 8 / arm","3 × 8 / arm","3 × 6 / arm","2 × 6 / arm")],
      ["Rotational med-ball throw (4–6 lb)", R("3 × 5 / side","4 × 5 / side","4 × 4 / side, max intent","3 × 4 / side")],
    ]},
  ]},
  3: { title: "Recovery + mobility", minutes: 30, blocks: [
    { name: "Recovery", items: [
      ["Easy bike / jog — conversational pace", R("15 min","15 min","15 min","10 min")],
      ["Mobility flow (hips, T-spine, ankles, sleeper stretch)", R("15 min","15 min","15 min","15 min")],
      ["Light arm care band routine", R("1 round","1 round","1 round","1 round")],
    ]},
  ]},
  4: { title: "Total-body power + CF footwork", minutes: 75, blocks: [
    { name: "Warm-up", items: [
      ["Dynamic warm-up + lateral shuffles & carioca", R("10 min","10 min","10 min","10 min")],
    ]},
    { name: "Outfield footwork", items: [
      ["Drop-step & crossover starts (each direction)", R("6 / side","8 / side","8 / side","6 / side")],
      ["Fly-ball routes: drop-step to 45°, turn & run (tossed or machine)", R("10 reps","12 reps","12 reps","15 game-speed reps")],
      ["Ground balls: charge, field glove-side, crow hop & throw", R("10 reps","12 reps","12 reps","12 reps")],
    ]},
    { name: "Power", items: [
      ["Box jump (step down)", R("3 × 4","4 × 4","4 × 3","3 × 3")],
      ["Lateral bound (stick 2 s)", R("3 × 4 / side","3 × 5 / side","4 × 4 / side","3 × 3 / side")],
      ["Med-ball scoop toss", R("3 × 5","4 × 5","4 × 4, max height","3 × 3")],
    ]},
    { name: "Strength", items: [
      ["Goblet / front squat", R("3 × 8","4 × 5","3 × 3 fast","2 × 3")],
      ["Kettlebell swing", R("3 × 10","4 × 10","4 × 8 explosive","3 × 6")],
      ["One-arm DB row", R("3 × 10 / arm","4 × 8 / arm","3 × 6 / arm","2 × 8 / arm")],
      ["Dead bug / side plank", R("3 × 8 / side","3 × 10 / side","3 × 10 / side","2 × 10 / side")],
    ]},
  ]},
  5: { title: "Throwing + hitting + arm care", minutes: 75, blocks: [
    { name: "Arm care", items: [
      ["J-band / band routine", R("1 round","1 round","1 round","1 round")],
    ]},
    { name: "Throwing", items: [
      ["Long toss (shorter than Tuesday)", R("to 90 ft","to 120 ft","to 150 ft","to 120 ft")],
      ["Do-or-die throws from CF to 2B/3B/home", R("—","8 throws","10 throws","10 throws")],
    ]},
    { name: "Hitting", items: [
      ["Tee work (situational: oppo, pull, up the middle)", R("40 swings","40 swings","30 swings","30 swings")],
      ["Front toss / machine — velocity & spin", R("40 swings","60 swings","50 max-intent","Live at-bats")],
      ["Bunting & slapping / short game", R("15 reps","15 reps","15 reps","20 reps")],
    ]},
    { name: "Core", items: [
      ["Med-ball shotput throw", R("3 × 5 / side","3 × 5 / side","4 × 4 / side","3 × 3 / side")],
      ["Side plank w/ reach-through", R("2 × 8 / side","3 × 8 / side","3 × 8 / side","2 × 8 / side")],
    ]},
  ]},
  6: { title: "Speed + conditioning", minutes: 50, blocks: [
    { name: "Warm-up", items: [
      ["Dynamic warm-up + build-up runs", R("10 min","10 min","10 min","10 min")],
    ]},
    { name: "Speed", items: [
      ["Home-to-first sprints (from the box, full rest)", R("4 reps","6 reps","6 reps","5 reps")],
      ["Pro-agility 5-10-5", R("4 reps","6 reps","6 reps","4 reps")],
      ["Flying 20s (20 yd build + 20 yd max)", R("—","4 reps","6 reps","4 reps")],
      ["First-to-third / second-to-home base running", R("—","4 reps","6 reps","6 reps")],
    ]},
    { name: "Conditioning", items: [
      ["Tempo runs — 100 yd at 70%, walk back", R("8 reps","10 reps","6 reps","—")],
      ["Repeat 60-yd sprints, 45 s rest", R("—","—","6 reps","5 reps")],
    ]},
  ]},
  0: { title: "Off — full rest", minutes: 0, blocks: [
    { name: "Rest", items: [
      ["Sleep 8–10 hours, eat well, hang out with friends", R("✔","✔","✔","✔")],
    ]},
  ]},
};

const BENCHMARKS = [
  { key: "dash60",  name: "60-yd dash",          unit: "s",   lowerBetter: true },
  { key: "h2f",     name: "Home to 1st",         unit: "s",   lowerBetter: true },
  { key: "proAg",   name: "Pro-agility 5-10-5",  unit: "s",   lowerBetter: true },
  { key: "broad",   name: "Broad jump",          unit: "in",  lowerBetter: false },
  { key: "throwV",  name: "Throwing velocity",   unit: "mph", lowerBetter: false },
  { key: "exitV",   name: "Exit velocity (tee)", unit: "mph", lowerBetter: false },
  { key: "dl",      name: "Trap-bar deadlift 3RM", unit: "lb", lowerBetter: false },
  { key: "bw",      name: "Body weight",         unit: "lb",  lowerBetter: null },
];
