// Canned program for local development without an API key (COACH_MOCK=1).
import type { Program, RoutineExercise } from "./schemas";
import type { Role } from "./types";

const ex = (exerciseId: string, o: Partial<RoutineExercise> = {}): RoutineExercise => ({
  exerciseId, sets: 3, warmupSets: 0, repsMin: 8, repsMax: 12, seconds: null, minutes: null, count: null,
  weightLb: null, restSec: 90, superset: null, notes: null, ...o,
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
