// Canned coach responses for local development without an API key (COACH_MOCK=1).
import type { DailyPlan, Profile, Program } from "./schemas";
import type { CheckIn, Role } from "./types";

const athleteQs = [
  "Let's get you set up. How old are you, and do you bat and throw right or left?",
  "What's on your calendar this winter — team practices and hitting lessons, which days?",
  "What has your hitting coach been working on with you lately? Give me the cues in their words.",
  "Any injuries — arm, shoulder, back, knees? And do you have any numbers already (bat speed, exit velo, 60)?",
];
const adultQs = [
  "Let's get you set up. Age, height, current weight, and goal weight?",
  "Has a doctor cleared you for exercise? Any health issues or injuries I should plan around?",
  "Walk me through a normal day of eating — especially after 6pm.",
  "What equipment do you have at home, and which days can you get 20–40 minutes?",
];

export function onboarding(role: Role, turns: number) {
  const qs = role === "athlete" ? athleteQs : adultQs;
  const i = Math.ceil(turns / 2); // turns = lines shown so far (coach + user)
  if (i < qs.length) return { message: qs[i], complete: false };
  return { message: "That's enough to start. Building your program now.", complete: true };
}

export function profile(role: Role): Profile {
  const base = {
    goals: [], preferredDays: [], weeklyCommitments: [], equipment: [], injuriesOrHealth: [], coachCues: [],
    baselineNumbers: [], foodNotes: null, otherNotes: null, targetDate: null, sex: null, heightIn: null,
    weightLb: null, goalWeightLb: null, age: null, sport: null,
  };
  return role === "athlete"
    ? { ...base, name: "Maicie", age: 16, sex: "female", sport: "softball — center field", goals: ["bat speed", "strength", "quickness"],
        daysPerWeek: 5, minutesPerSession: 60, equipment: ["tee", "net", "cage", "bat sensor", "gym"], targetDate: "2027-06-01" }
    : { ...base, name: "Dad", age: 45, sex: "male", heightIn: 71, weightLb: 245, goalWeightLb: 205,
        goals: ["lose weight"], daysPerWeek: 4, minutesPerSession: 30, equipment: ["dumbbells", "bands"], foodNotes: "evening snacking" };
}

const day = (dayOfWeek: number, title: string, kind: Program["weeklyTemplate"][number]["kind"], minutes: number, items: string[][]) => ({
  dayOfWeek, title, kind, minutes,
  sections: [{ title: "Main", items: items.map(([name, prescription]) => ({ name, prescription, notes: null })) }],
});

export function program(role: Role): Program {
  const weeks = [1, 2, 3, 4].map((w) => ({ week: w, theme: w === 1 ? "Baseline + build" : w === 4 ? "Retest" : "Build", progression: "Add a set or 5% load.", deload: w === 4 }));
  if (role === "athlete")
    return {
      title: "Block 1 — Build the engine", summary: "Baseline testing, then build strength and bat speed.", blockNumber: 1, blockWeeks: 4,
      emphasis: [{ area: "Hitting", percent: 45 }, { area: "Strength", percent: 30 }, { area: "Quickness", percent: 25 }], weeks,
      weeklyTemplate: [
        day(1, "Lower strength + acceleration", "training", 60, [["Trap-bar deadlift", "4 × 5"], ["10-yd starts", "6 reps"]]),
        day(2, "Hitting + upper", "training", 60, [["Tee work", "50 swings"], ["Overload/underload swings", "3 × 5 each"]]),
        day(3, "Recovery", "recovery", 30, [["Mobility flow", "15 min"]]),
        day(4, "Power + CF footwork", "training", 60, [["Drop-step routes", "12 reps"], ["Lateral bounds", "3 × 4 / side"]]),
        day(5, "Hitting volume", "training", 60, [["Front toss, max intent", "50 swings"]]),
        day(6, "Speed + base running", "training", 45, [["Home-to-first", "6 reps"], ["5-10-5", "4 reps"]]),
        day(0, "Off", "rest", 0, []),
      ],
      tests: [{ name: "Exit velo (tee)", protocol: "Best of 5", unit: "mph", when: "Week 1 and 4" }],
      nutrition: null, rules: ["Pain stops the drill.", "Sleep 8+ hours."],
    };
  return {
    title: "Block 1 — Win the evenings", summary: "Moderate deficit, three short strength sessions, daily walks.", blockNumber: 1, blockWeeks: 4,
    emphasis: [{ area: "Nutrition", percent: 60 }, { area: "Strength", percent: 25 }, { area: "Walking", percent: 15 }], weeks,
    weeklyTemplate: [
      day(1, "Strength A", "training", 30, [["Goblet squat", "3 × 10"], ["Push-ups", "3 × max-2"]]),
      day(2, "Walk", "training", 30, [["Brisk walk", "30 min"]]),
      day(3, "Strength B", "training", 30, [["DB row", "3 × 10"], ["RDL", "3 × 10"]]),
      day(4, "Walk", "training", 30, [["Brisk walk", "30 min"]]),
      day(5, "Strength A", "training", 30, [["Goblet squat", "3 × 10"]]),
      day(6, "Long walk", "training", 60, [["Walk", "60 min"]]),
      day(0, "Rest", "rest", 0, []),
    ],
    tests: [{ name: "Weekly average weight", protocol: "Daily weigh-ins, 7-day average", unit: "lb", when: "Weekly" }],
    nutrition: { calories: 2200, proteinG: 190, approach: "Protein first, plan dinner in the morning.", eveningStrategy: "Kitchen closes at 8pm." },
    rules: ["Weigh in every morning.", "Kitchen closes at 8pm."],
  };
}

export function dailyPlan(role: Role, c: CheckIn | null): DailyPlan {
  const red = !!c?.pain;
  return {
    headline: red ? "Pain reported — recovery only today." : "Get the work in. No shortcuts.",
    readiness: red ? "red" : c && (c.sleepHours ?? 8) < 7 ? "yellow" : "green",
    coachNote: red ? "You reported pain, so we're not loading that area. Tell your dad." : "Plan as written. Hit every item.",
    sections: [
      { title: "Warm-up", items: [{ text: "Dynamic warm-up — 10 min", detail: null }] },
      { title: "Main work", items: [{ text: role === "athlete" ? "Tee work — 50 swings" : "Goblet squat — 3 × 10", detail: "Full intent" }, { text: role === "athlete" ? "10-yd starts — 6 reps" : "Walk — 30 min", detail: null }] },
    ],
    meals: role === "athlete" ? null : { calories: 2200, proteinG: 190, breakfast: "Eggs + fruit", lunch: "Chicken salad wrap", dinner: "Salmon, rice, broccoli", eveningSnack: "Greek yogurt", eveningRule: "Kitchen closes at 8pm." },
    fueling: role === "athlete" ? "Eat a real snack with protein within an hour of training." : null,
  };
}
