// Canned program for local development without an API key (COACH_MOCK=1).
import type { Program, RoutineExercise } from "./schemas";
import type { Role } from "./types";

const ex = (exerciseId: string, o: Partial<RoutineExercise> = {}): RoutineExercise => ({
  exerciseId, sets: 3, warmupSets: 0, repsMin: 8, repsMax: 12, seconds: null, minutes: null, count: null,
  weightLb: null, targetRpe: 7, tempo: null, restSec: 90, superset: null, notes: null, ...o,
});
const weeks = [1, 2, 3, 4].map((w) => ({ week: w, theme: w === 4 ? "Lighter week + retest" : `Build ${w}`, progression: w === 4 ? "Cut sets by a third." : "Add reps, then load.", deload: w === 4 }));

export function program(role: Role): Program {
  if (role === "athlete")
    return {
      title: "Block 1 — Build the engine",
      summary: "Baseline tests, then bat speed, lower-body strength and first-step quickness.",
      blockWeeks: 4,
      emphasis: [{ area: "Hitting", percent: 45 }, { area: "Strength", percent: 30 }, { area: "Quickness", percent: 25 }],
      weeks,
      routines: [
        { key: "lower-accel", name: "Lower + Acceleration", purpose: "Strength and first step for range in center field.", estMinutes: 60, exercises: [
          ex("dynamic_warmup", { sets: 1, repsMin: null, repsMax: null, seconds: 600, restSec: 0 }),
          ex("sprint_10", { sets: 6, repsMin: null, repsMax: null, restSec: 60 }),
          ex("trap_bar_deadlift", { sets: 4, repsMin: 5, repsMax: 5, weightLb: 95, restSec: 150 }),
          ex("rfe_split_squat", { superset: "A", repsMin: 6, repsMax: 8 }),
          ex("copenhagen_plank", { superset: "A", repsMin: null, repsMax: null, seconds: 20 }),
        ] },
        { key: "hitting-upper", name: "Hitting + Upper", purpose: "Bat speed: overload/underload and intent.", estMinutes: 60, exercises: [
          ex("band_arm_care", { sets: 1, repsMin: 10, repsMax: 10, restSec: 0 }),
          ex("underload_swings", { sets: 3, repsMin: null, repsMax: null, count: 5, restSec: 60 }),
          ex("overload_swings", { sets: 3, repsMin: null, repsMax: null, count: 5, restSec: 60 }),
          ex("tee_work", { sets: 2, repsMin: null, repsMax: null, count: 25, restSec: 120 }),
          ex("mb_rotational_throw", { sets: 3, repsMin: 5, repsMax: 5 }),
          ex("db_bench", { repsMin: 6, repsMax: 8 }),
        ] },
        { key: "test-day", name: "Test Day", purpose: "Baseline numbers to measure the block against.", estMinutes: 60, exercises: [
          ex("tee_work", { sets: 1, repsMin: null, repsMax: null, count: 10 }),
          ex("home_to_first", { sets: 3, repsMin: null, repsMax: null }),
          ex("broad_jump", { sets: 3, repsMin: 1, repsMax: 1 }),
        ] },
      ],
      schedule: [
        { dayOfWeek: 0, routineKey: null, note: "Off" }, { dayOfWeek: 1, routineKey: "test-day", note: null },
        { dayOfWeek: 2, routineKey: "hitting-upper", note: null }, { dayOfWeek: 3, routineKey: null, note: "Recovery" },
        { dayOfWeek: 4, routineKey: "lower-accel", note: null }, { dayOfWeek: 5, routineKey: "hitting-upper", note: null },
        { dayOfWeek: 6, routineKey: "lower-accel", note: null },
      ],
      dailyHabits: ["Sleep 8+ hours", "Band arm care before throwing"],
      nutrition: null,
      fueling: "Carbs + protein within an hour after training.",
      rules: ["Pain stops the drill.", "Every swing at full intent."],
    };
  return {
    title: "Block 1 — Win the evenings",
    summary: "Moderate deficit, three short home strength sessions, daily post-dinner walks.",
    blockWeeks: 4,
    emphasis: [{ area: "Nutrition", percent: 50 }, { area: "Strength", percent: 30 }, { area: "Walking", percent: 20 }],
    weeks,
    routines: [
      { key: "strength-a", name: "Strength A", purpose: "More muscle = better blood-sugar control.", estMinutes: 30, exercises: [
        ex("goblet_squat", { weightLb: 35 }), ex("db_floor_press", { weightLb: 30 }), ex("one_arm_db_row", { weightLb: 35 }),
        ex("plank", { repsMin: null, repsMax: null, seconds: 30, restSec: 45 }),
      ] },
      { key: "strength-b", name: "Strength B", purpose: "Hinge and carry strength for a healthy back.", estMinutes: 30, exercises: [
        ex("db_rdl", { weightLb: 40 }), ex("reverse_lunge", { weightLb: 20 }), ex("db_ohp", { weightLb: 25 }),
        ex("farmer_carry", { repsMin: null, repsMax: null, seconds: 40, weightLb: 40 }),
      ] },
      { key: "walk", name: "Brisk Walk", purpose: "Toward 150 minutes this week.", estMinutes: 30, exercises: [
        ex("brisk_walk", { sets: 1, repsMin: null, repsMax: null, minutes: 30, restSec: 0 }),
      ] },
    ],
    schedule: [
      { dayOfWeek: 0, routineKey: null, note: "Rest" }, { dayOfWeek: 1, routineKey: "strength-a", note: null },
      { dayOfWeek: 2, routineKey: "walk", note: null }, { dayOfWeek: 3, routineKey: "strength-b", note: null },
      { dayOfWeek: 4, routineKey: "walk", note: null }, { dayOfWeek: 5, routineKey: "strength-a", note: null },
      { dayOfWeek: 6, routineKey: "walk", note: "Longer walk" },
    ],
    dailyHabits: ["10–15 min walk after dinner", "Protein at every meal"],
    nutrition: { calories: 2200, proteinG: 180, carbApproach: "Fiber-rich carbs; protein and veg first.", eveningPlan: {
      beforeTv: ["Walk 10–15 minutes after dinner", "Sparkling water in hand when you sit down"],
      snackBudget: "200–250 kcal, before 8:30", snackOptions: ["Greek yogurt with berries", "Cheese stick + apple", "3 cups air-popped popcorn"],
      ifThen: [{ craving: "Chips", instead: "3 cups popcorn in a bowl — never from the bag" }, { craving: "Sweets", instead: "Greek yogurt with fruit" }],
      afterCutoff: "Sparkling water or herbal tea, then brush your teeth", note: "Log it either way. No guilt, just data." } },
    fueling: null,
    rules: ["Weigh in each morning.", "Walk after dinner."],
  };
}

// ---- Recipes (dev only)
import type { RecipeBatch } from "./schemas";
export function recipes(existing: string[]): RecipeBatch["recipes"] {
  const n = existing.length;
  const base: RecipeBatch["recipes"] = [
    { title: "Sheet-Pan Chicken Fajitas", description: "Smoky chicken and peppers roasted on one pan.", timeMin: 35, tags: ["sheet-pan", "30-min"],
      ingredients: [
        { item: "boneless skinless chicken breast", qty: 1.5, unit: "lb", aisle: "Meat & Seafood", note: "sliced" },
        { item: "bell peppers", qty: 3, unit: "each", aisle: "Produce", note: "sliced" },
        { item: "yellow onion", qty: 1, unit: "each", aisle: "Produce", note: null },
        { item: "olive oil", qty: 2, unit: "tbsp", aisle: "Spices & Oils", note: null },
        { item: "fajita seasoning", qty: 2, unit: "tbsp", aisle: "Spices & Oils", note: null },
        { item: "plain Greek yogurt", qty: 1, unit: "cup", aisle: "Dairy & Eggs", note: "for topping" },
        { item: "flour tortillas", qty: 8, unit: "each", aisle: "Bakery & Bread", note: "for the kids" },
      ],
      steps: ["Heat oven to 425°F.", "Toss chicken, peppers and onion with oil and seasoning.", "Roast 20–25 min.", "Serve with yogurt and tortillas."],
      nutrition: { calories: 360, proteinG: 42, carbsG: 14, fiberG: 4, fatG: 12 },
      plateTip: "Skip the tortilla or have one; fill up on peppers and chicken with yogurt.", familyTip: "Warm tortillas and cheese for the kids." },
    { title: "Turkey Taco Lettuce Bowls", description: "Seasoned turkey over crunchy lettuce with beans and salsa.", timeMin: 25, tags: ["skillet", "30-min"],
      ingredients: [
        { item: "ground turkey 93% lean", qty: 1.5, unit: "lb", aisle: "Meat & Seafood", note: null },
        { item: "black beans", qty: 1, unit: "can", aisle: "Canned & Jarred", note: "rinsed" },
        { item: "romaine lettuce", qty: 2, unit: "head", aisle: "Produce", note: null },
        { item: "salsa", qty: 1, unit: "jar", aisle: "Canned & Jarred", note: null },
        { item: "yellow onion", qty: 1, unit: "each", aisle: "Produce", note: "diced" },
        { item: "olive oil", qty: 1, unit: "tbsp", aisle: "Spices & Oils", note: null },
      ],
      steps: ["Brown turkey with onion.", "Add beans and seasoning.", "Serve over lettuce with salsa."],
      nutrition: { calories: 390, proteinG: 38, carbsG: 20, fiberG: 8, fatG: 16 },
      plateTip: "Big bed of lettuce, 1/2 cup beans, skip the chips.", familyTip: "Taco shells and shredded cheese on the side." },
  ];
  return base.map((r) => ({ ...r, title: n ? `${r.title} ${n + 1}` : r.title }));
}

export function protein(text: string) {
  return text.split(/,| and /i).map((t) => t.trim()).filter(Boolean).map((label) => ({
    label, grams: /egg/i.test(label) ? 12 : /shake|fairlife/i.test(label) ? 30 : /chicken/i.test(label) ? 40 : 5, assumed: !/\d/.test(label),
  }));
}

export function guide(name: string) {
  return {
    summary: `${name} builds strength you can use every day.`,
    setup: ["Feet about shoulder-width apart.", "Brace your core before you move."],
    steps: ["Start in a tall position.", "Lower with control.", "Drive back up smoothly."],
    cues: ["Chest proud", "Knees track over toes", "Control the lowering"],
    mistakes: ["Rushing the reps — slow down the lowering.", "Losing your brace — reset between reps."],
    easier: "Use a lighter weight or a shorter range.", harder: "Add a pause at the bottom.",
    breathing: "Breathe in on the way down, out on the way up.", safety: null,
  };
}

export function screenshot(today: string) {
  return { found: true, source: "Apple Fitness" as const, activity: "Outdoor Walk", date: today, startTime: "18:40", durationMin: 42, distanceMi: 2.1,
    activeCalories: 210, totalCalories: 280, avgHR: 112, maxHR: 131, elevationFt: 45, avgPace: "20:00 /mi", zoneMinutes: [{ zone: 2, minutes: 30 }] };
}

export function food(text: string, photo: boolean) {
  if (photo && /label/i.test(text)) return { kind: "label" as const, servingSize: "2/3 cup (55g)", items: [{ label: "Granola", calories: 230, proteinG: 6, carbsG: 34, fiberG: 4, fatG: 8, assumed: false }] };
  if (photo) return { kind: "meal" as const, servingSize: "", items: [
    { label: "Grilled chicken (~6 oz)", calories: 280, proteinG: 52, carbsG: 0, fiberG: 0, fatG: 6, assumed: true },
    { label: "Brown rice (~1 cup)", calories: 220, proteinG: 5, carbsG: 46, fiberG: 4, fatG: 2, assumed: true },
    { label: "Broccoli (~1 cup)", calories: 55, proteinG: 4, carbsG: 11, fiberG: 5, fatG: 1, assumed: true } ] };
  return { kind: "meal" as const, servingSize: "", items: text.split(/,| and /i).map((t) => t.trim()).filter(Boolean).map((label) => ({
    label, calories: /egg/i.test(label) ? 140 : 120, proteinG: /egg/i.test(label) ? 12 : /shake/i.test(label) ? 30 : 4, carbsG: /toast/i.test(label) ? 15 : 2,
    fiberG: /toast/i.test(label) ? 2 : 0, fatG: /egg/i.test(label) ? 10 : 2, assumed: !/\d/.test(label) })) };
}
