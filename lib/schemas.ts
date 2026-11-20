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
  weightLb: z.number().nullable().describe("Starting load if you can estimate it, else null"),
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
    .object({ calories: z.number(), proteinG: z.number(), carbApproach: z.string(), eveningPlan: z.string() })
    .nullable()
    .describe("Adults only; null for athletes"),
  fueling: z.string().nullable().describe("Athletes only: performance fueling guidance; null for adults"),
  rules: z.array(z.string()),
});
export type Program = z.infer<typeof Program>;
export type Routine = Program["routines"][number];
export type RoutineExercise = Routine["exercises"][number];
