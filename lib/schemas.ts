import { z } from "zod";

// Shapes the coach must return (enforced with structured outputs).
// Optional fields are expressed as nullable so every key is always present.

export const OnboardingTurn = z.object({
  message: z.string().describe("What the coach says next — usually one or two questions."),
  complete: z.boolean().describe("True only when there is enough information to build the program."),
});

export const Profile = z.object({
  name: z.string(),
  age: z.number().nullable(),
  sex: z.enum(["male", "female"]).nullable(),
  heightIn: z.number().nullable(),
  weightLb: z.number().nullable(),
  goalWeightLb: z.number().nullable(),
  sport: z.string().nullable().describe("e.g. softball — center field"),
  goals: z.array(z.string()),
  daysPerWeek: z.number(),
  minutesPerSession: z.number(),
  preferredDays: z.array(z.string()),
  weeklyCommitments: z.array(z.string()).describe("Fixed practices, lessons, work constraints"),
  equipment: z.array(z.string()),
  injuriesOrHealth: z.array(z.string()),
  foodNotes: z.string().nullable().describe("Eating patterns, trouble spots, likes/dislikes, cooking"),
  coachCues: z.array(z.string()).describe("Cues/drills from a hitting coach or other coach to reinforce"),
  baselineNumbers: z.array(z.object({ test: z.string(), value: z.number(), unit: z.string() })),
  targetDate: z.string().nullable().describe("YYYY-MM-DD the program builds toward, if any"),
  otherNotes: z.string().nullable(),
});
export type Profile = z.infer<typeof Profile>;

const Item = z.object({
  name: z.string(),
  prescription: z.string().describe("sets × reps, time, distance, or swing count"),
  notes: z.string().nullable(),
});

export const Program = z.object({
  title: z.string(),
  summary: z.string().describe("2–4 sentences: what this block is for and why"),
  blockNumber: z.number(),
  blockWeeks: z.number(),
  emphasis: z
    .array(z.object({ area: z.string(), percent: z.number() }))
    .describe("How training time is split this block, summing to 100"),
  weeks: z.array(
    z.object({
      week: z.number(),
      theme: z.string(),
      progression: z.string().describe("How loads/volume change vs. the template this week"),
      deload: z.boolean(),
    }),
  ),
  weeklyTemplate: z.array(
    z.object({
      dayOfWeek: z.number().describe("0 = Sunday … 6 = Saturday"),
      title: z.string(),
      kind: z.enum(["training", "recovery", "rest", "testing"]),
      minutes: z.number(),
      sections: z.array(z.object({ title: z.string(), items: z.array(Item) })),
    }),
  ),
  tests: z
    .array(z.object({ name: z.string(), protocol: z.string(), unit: z.string(), when: z.string() }))
    .describe("Benchmarks to measure and when (empty if not applicable)"),
  nutrition: z
    .object({
      calories: z.number(),
      proteinG: z.number(),
      approach: z.string(),
      eveningStrategy: z.string(),
    })
    .nullable()
    .describe("Weight-loss targets for adults only; null for athletes"),
  rules: z.array(z.string()).describe("Short standing rules the coach will enforce"),
});
export type Program = z.infer<typeof Program>;

export const DailyPlan = z.object({
  headline: z.string().describe("One short line: today's mission"),
  readiness: z.enum(["green", "yellow", "red"]),
  coachNote: z.string().describe("2–3 direct sentences explaining today's adjustments"),
  sections: z.array(
    z.object({
      title: z.string(),
      items: z.array(z.object({ text: z.string(), detail: z.string().nullable() })),
    }),
  ),
  meals: z
    .object({
      calories: z.number(),
      proteinG: z.number(),
      breakfast: z.string(),
      lunch: z.string(),
      dinner: z.string(),
      eveningSnack: z.string(),
      eveningRule: z.string().describe("One concrete rule for tonight"),
    })
    .nullable()
    .describe("Meal plan for weight-loss users; null for athletes"),
  fueling: z.string().nullable().describe("Performance fueling tip for athletes; null for adults"),
});
export type DailyPlan = z.infer<typeof DailyPlan>;
