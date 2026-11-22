import { z } from "zod";

// What the AI coach returns when it builds a program (enforced with structured outputs).

const Target = z.object({
  exerciseId: z.string().describe("An id from the exercise library"),
  sets: z.number().describe("Working sets (not counting warm-ups)"),
  warmupSets: z.number(),
  repsMin: z.number().nullable(),
  repsMax: z.number().nullable(),
  seconds: z.number().nullable().describe("For timed exercises"),
  minutes: z.number().nullable().describe("For cardio"),
  count: z.number().nullable().describe("Swings or throws per set"),
  weightLb: z.number().nullable().describe("Suggested starting load in lb for weighted exercises (required for weight_reps); null for bodyweight/time/cardio"),
  targetRpe: z.number().nullable().describe("Target effort 1–10 (RPE) for working sets, e.g. 7 = about 3 reps left"),
  tempo: z.string().nullable().describe("Lifting tempo like '3-1-1' (down-pause-up) when it matters, else null"),
  restSec: z.number(),
  superset: z.string().nullable().describe("Same letter = superset (e.g. 'A'); null if none"),
  notes: z.string().nullable().describe("One short coaching note or cue"),
});

export const Program = z.object({
  title: z.string(),
  summary: z.string().describe("2–4 sentences: what this block is for and why, tied to their profile"),
  blockWeeks: z.number(),
  emphasis: z.array(z.object({ area: z.string(), percent: z.number() })),
  weeks: z.array(z.object({ week: z.number(), theme: z.string(), progression: z.string(), deload: z.boolean() })),
  routines: z.array(
    z.object({
      key: z.string().describe("short slug, e.g. 'strength-a'"),
      name: z.string(),
      purpose: z.string().describe("One line: why this session matters for their goals"),
      estMinutes: z.number(),
      exercises: z.array(Target),
    }),
  ),
  schedule: z
    .array(z.object({ dayOfWeek: z.number().describe("0=Sun … 6=Sat"), routineKey: z.string().nullable(), note: z.string().nullable() }))
    .describe("Exactly 7 entries; routineKey null on rest days"),
  dailyHabits: z.array(z.string()).describe("Short daily habits, e.g. post-dinner walk"),
  nutrition: z
    .object({
      calories: z.number(),
      proteinG: z.number(),
      carbApproach: z.string(),
      eveningPlan: z.object({
        beforeTv: z.array(z.string()).describe("Short actions before/at TV time, each under 12 words"),
        snackBudget: z.string().nullable().describe("e.g. '200–250 kcal, before 8:30'"),
        snackOptions: z.array(z.string()).describe("3–5 specific snack options, each under 10 words"),
        ifThen: z.array(z.object({ craving: z.string().describe("e.g. 'Chips'"), instead: z.string().describe("Short replacement, under 14 words") })),
        afterCutoff: z.string().nullable().describe("What to do if hungry after the kitchen closes"),
        note: z.string().nullable(),
      }),
    })
    .nullable()
    .describe("Adults only; null for athletes"),
  fueling: z.string().nullable().describe("Athletes only: performance fueling guidance; null for adults"),
  rules: z.array(z.string()),
});
export type Program = z.infer<typeof Program>;
export type Routine = Program["routines"][number];
export type RoutineExercise = Routine["exercises"][number];

export const AISLES = ["Produce", "Meat & Seafood", "Dairy & Eggs", "Bakery & Bread", "Pantry & Grains", "Canned & Jarred", "Spices & Oils", "Frozen", "Other"] as const;

export const RecipeBatch = z.object({
  recipes: z.array(
    z.object({
      title: z.string(),
      description: z.string().describe("One appetizing sentence"),
      timeMin: z.number().describe("Total minutes, prep + cook"),
      tags: z.array(z.string()).describe("2–4 tags, e.g. sheet-pan, slow cooker, grill, 30-min, tacos, kid-friendly"),
      ingredients: z.array(
        z.object({
          item: z.string().describe("Grocery item as you'd find it in the store, e.g. 'boneless skinless chicken thighs'"),
          qty: z.number().nullable(),
          unit: z.string().describe("US units: lb, oz, cup, tbsp, tsp, each, can, bunch… ('' if none)"),
          aisle: z.enum(AISLES),
          note: z.string().nullable().describe("prep note, e.g. 'diced'"),
        }),
      ),
      steps: z.array(z.string()).describe("Short numbered steps, 4–8"),
      nutrition: z.object({ calories: z.number(), proteinG: z.number(), carbsG: z.number(), fiberG: z.number(), fatG: z.number() })
        .describe("Estimated per serving of the main recipe (without family add-ons)"),
      plateTip: z.string().describe("How Mike builds his plate for blood sugar, e.g. 'half veg, 6 oz chicken, ½ cup rice max'"),
      familyTip: z.string().nullable().describe("Optional add-on for the rest of the family, e.g. 'warm tortillas and rice for the kids'"),
    }),
  ),
});
export type RecipeBatch = z.infer<typeof RecipeBatch>;

export const ProteinEstimate = z.object({
  items: z.array(z.object({
    label: z.string().describe("Short label with the amount, e.g. '2 large eggs' or 'Fairlife shake (11.5 oz)'"),
    grams: z.number().describe("Estimated grams of protein, whole number"),
    assumed: z.boolean().describe("True if you had to assume the portion size"),
  })),
});

export const ExerciseGuide = z.object({
  summary: z.string().describe("One sentence: what it trains and why it matters"),
  setup: z.array(z.string()).describe("2–4 setup points"),
  steps: z.array(z.string()).describe("3–6 numbered steps"),
  cues: z.array(z.string()).describe("3 short coaching cues"),
  mistakes: z.array(z.string()).describe("2–4 common mistakes and the fix"),
  easier: z.string().describe("An easier variation"),
  harder: z.string().describe("A harder variation"),
  breathing: z.string(),
  safety: z.string().nullable().describe("A safety note if relevant, else null"),
});
export type ExerciseGuide = z.infer<typeof ExerciseGuide>;
