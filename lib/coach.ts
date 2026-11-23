import Anthropic from "@anthropic-ai/sdk";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import type { z } from "zod";
import { db } from "./db";
import { EXERCISE_BY_ID } from "./exercises";
import { ExerciseGuide, FoodEstimate, Program, ProgramWire, ProteinEstimate, RecipeBatch, ScreenshotWorkout, programFromWire } from "./schemas";
import { GUIDE_SYSTEM, RECIPE_SYSTEM, coachSystem, programRequest, recipeRequest } from "./prompts";
import * as mock from "./mock";
import type { HealthBio, Profile, Role } from "./types";

export const MODEL = process.env.COACH_MODEL ?? "claude-opus-5-5";
// Small, frequent jobs (logging) use the fast model.
export const FAST_MODEL = process.env.COACH_FAST_MODEL ?? "claude-haiku-5-5";

export class CoachError extends Error {}

type Effort = "low" | "medium" | "high";
type Msg = Anthropic.Beta.BetaMessageParam;

let _client: Anthropic | undefined;
export const client = () => (_client ??= new Anthropic());

export const mockMode = () =>
  process.env.NODE_ENV !== "production" && (process.env.COACH_MOCK === "1" || !process.env.ANTHROPIC_API_KEY);

// Per-million-token prices (USD) used for the in-app cost meter.
const PRICES: Record<string, { in: number; out: number; cacheRead: number }> = {
  "claude-opus-5-5": { in: 4, out: 20, cacheRead: 0.2 },
  "claude-opus-5": { in: 5, out: 25, cacheRead: 0.5 },
  "claude-opus-4-8": { in: 5, out: 25, cacheRead: 0.5 },
  "claude-sonnet-5-5": { in: 2, out: 10, cacheRead: 0.1 },
  "claude-haiku-5-5": { in: 0.1, out: 0.5, cacheRead: 0.01 },
};

export async function recordUsage(model: string, u: Anthropic.Beta.BetaUsage) {
  const p = PRICES[model] ?? PRICES["claude-opus-5-5"];
  const write = u.cache_creation_input_tokens ?? 0;
  const read = u.cache_read_input_tokens ?? 0;
  const micros =
    (u.input_tokens * p.in + write * p.in * 1.25 + read * p.cacheRead + u.output_tokens * p.out); // = USD * 1e6 / 1e6 tokens
  const month = new Date().toISOString().slice(0, 7);
  await Promise.all([
    db().incrby(`usage:${month}:micros`, micros),
    db().incrby(`usage:${month}:calls`, 1),
    db().incrby(`usage:${month}:in`, u.input_tokens + write + read),
    db().incrby(`usage:${month}:out`, u.output_tokens),
  ]);
}

export async function usageThisMonth() {
  const month = new Date().toISOString().slice(0, 7);
  const [micros, calls, tin, tout] = await Promise.all(
    ["micros", "calls", "in", "out"].map((k) => db().get<number>(`usage:${month}:${k}`)),
  );
  return { month, usd: (micros ?? 0) / 1e6, calls: calls ?? 0, inputTokens: tin ?? 0, outputTokens: tout ?? 0 };
}

/** One structured call to Claude. Returns the parsed object and the raw content (for append-only replay). */
async function ask<S extends z.ZodType>(
  schema: S,
  opts: { system: string; messages: Msg[]; effort: Effort; maxTokens?: number; model?: string },
): Promise<{ data: z.infer<S>; content: Anthropic.Beta.BetaContentBlockParam[] }> {
  let res;
  try {
    // Streamed so long answers (like a full program) don't hit the SDK's non-streaming limit.
    const model = opts.model ?? MODEL;
    // Server-side refusal fallback is offered for the main model; the fast model has none.
    const fallback = model === FAST_MODEL ? {} : { betas: ["server-side-fallback-2026-07-01"] as Anthropic.Beta.AnthropicBeta[], fallbacks: "default" as const };
    res = await client().beta.messages.stream({
      model,
      max_tokens: opts.maxTokens ?? 16000,
      system: [{ type: "text", text: opts.system, cache_control: { type: "ephemeral" } }],
      messages: opts.messages,
      output_config: { effort: opts.effort, format: betaZodOutputFormat(schema) },
      // If a safety classifier declines, retry server-side on Anthropic's recommended fallback model.
      ...fallback,
    }).finalMessage();
  } catch (e) {
    if (e instanceof Anthropic.RateLimitError) throw new CoachError("The coach is busy right now. Try again in a minute.");
    if (e instanceof Anthropic.AuthenticationError) throw new CoachError("The Claude API key is missing or invalid.");
    if (e instanceof Anthropic.APIConnectionError) throw new CoachError("Couldn't reach the coach. Check your connection.");
    if (e instanceof Anthropic.APIError) {
      console.error("Claude API error", e.status, e.message);
      throw new CoachError(`Coach error (${e.status}): ${String(e.message).slice(0, 220)}`);
    }
    if (e instanceof Anthropic.AnthropicError) throw new CoachError(`Coach error: ${e.message}`);
    throw e;
  }
  await recordUsage(res.model, res.usage);
  if (res.stop_reason === "refusal") throw new CoachError("The coach couldn't answer that. Try rephrasing.");
  if (res.stop_reason === "max_tokens") throw new CoachError("The coach's answer was cut off. Try again.");
  if (!res.parsed_output) throw new CoachError("The coach's answer didn't come through right. Try again.");
  // Keep blocks as returned (thinking included) but drop SDK-only parse fields before replaying.
  const content = res.content.map((b) =>
    b.type === "text" ? ({ type: "text", text: b.text } as const) : (b as Anthropic.Beta.BetaContentBlockParam),
  );
  return { data: res.parsed_output as z.infer<S>, content };
}

// ---------------- Program ----------------

/** Ask the coach for a program, then keep only valid exercises and a full 7-day schedule. */
export async function generateProgram(role: Role, name: string, profile: Profile, startDate: string, bio: HealthBio | null = null): Promise<Program> {
  const raw = mockMode()
    ? mock.program(role)
    : programFromWire((
        await ask(ProgramWire, {
          system: coachSystem(role),
          messages: [{ role: "user", content: programRequest(role, name, profile, startDate, bio) }],
          effort: "high",
          maxTokens: 32000,
        })
      ).data);
  return cleanProgram(raw);
}

export function cleanProgram(p: Program): Program {
  const routines = p.routines
    .map((r) => ({ ...r, exercises: r.exercises.filter((e) => EXERCISE_BY_ID.has(e.exerciseId)) }))
    .filter((r) => r.exercises.length);
  const keys = new Set(routines.map((r) => r.key));
  const schedule = Array.from({ length: 7 }, (_, d) => {
    const s = p.schedule.find((x) => x.dayOfWeek === d);
    return { dayOfWeek: d, routineKey: s?.routineKey && keys.has(s.routineKey) ? s.routineKey : null, note: s?.note ?? null };
  });
  return { ...p, routines, schedule };
}

// ---------------- Recipes ----------------

export async function generateRecipes(input: {
  count: number; bio: HealthBio | null; profile: Profile | null; existing: string[]; liked: string[]; disliked: string[];
}): Promise<RecipeBatch["recipes"]> {
  if (mockMode()) return mock.recipes(input.existing);
  const { data } = await ask(RecipeBatch, {
    system: RECIPE_SYSTEM,
    messages: [{ role: "user", content: recipeRequest(input.count, input.bio, input.profile, input.existing, input.liked, input.disliked) }],
    effort: "medium",
    maxTokens: 32000,
  });
  const seen = new Set(input.existing.map((t) => t.toLowerCase()));
  return data.recipes.filter((r) => !seen.has(r.title.toLowerCase()));
}

// ---------------- Protein from plain words ----------------

const PROTEIN_SYSTEM = `Estimate grams of protein in foods someone describes in plain words (US portions).
Split the description into separate items. Use known label values for brand-name products (e.g. Fairlife, Premier, Chobani)
and standard USDA values otherwise. If an amount isn't given, assume one typical serving and set assumed to true.
Round to whole grams. Ignore anything that isn't food or drink. Return no items if nothing edible is described.`;

export async function estimateProtein(text: string) {
  if (mockMode()) return mock.protein(text);
  const { data } = await ask(ProteinEstimate, {
    system: PROTEIN_SYSTEM,
    messages: [{ role: "user", content: text }],
    effort: "low",
    maxTokens: 2000,
    model: FAST_MODEL,
  });
  return data.items.filter((i) => i.grams >= 0 && i.grams <= 300).slice(0, 15);
}

// ---------------- Exercise guides (written once, cached) ----------------

export async function writeExerciseGuide(e: { name: string; kind: string; equipment: string[]; cue: string }): Promise<ExerciseGuide> {
  if (mockMode()) return mock.guide(e.name);
  const { data } = await ask(ExerciseGuide, {
    system: GUIDE_SYSTEM,
    messages: [{ role: "user", content: `Exercise: ${e.name} (${e.kind}; equipment: ${e.equipment.join(", ")}). Our one-line cue: "${e.cue}".` }],
    effort: "low",
    maxTokens: 4000,
  });
  return data;
}

// ---------------- Workout screenshots (Apple Fitness, Strava…) ----------------

export async function readWorkoutScreenshot(mediaType: "image/jpeg" | "image/png" | "image/webp", base64: string, today: string): Promise<ScreenshotWorkout> {
  if (mockMode()) return mock.screenshot(today);
  const { data } = await ask(ScreenshotWorkout, {
    system: `Read workout summary screenshots from fitness apps (Apple Fitness/Activity, Apple Health, Strava, Garmin). Copy numbers exactly
as shown; convert km to miles and kJ to kcal. Use 0 or '' for anything not visible — never guess. Today is ${today}; resolve relative dates
like "Today" or "Yesterday" against it.`,
    messages: [{ role: "user", content: [
      { type: "image", source: { type: "base64", media_type: mediaType, data: base64 } },
      { type: "text", text: "Extract the workout from this screenshot." },
    ] }],
    effort: "low",
    maxTokens: 3000,
    model: FAST_MODEL,
  });
  return data;
}

// ---------------- Food from words or photos ----------------

const FOOD_SYSTEM = `Estimate nutrition (calories, protein, carbs, fiber, fat) for food a person describes or photographs (US portions).
- Words or a plate photo: kind "meal". Split into separate items; estimate portions from the description or the photo (plate size, utensils,
  packaging). Use known label values for brand-name products and standard USDA values otherwise. If an amount isn't given or you're judging
  from a photo, set assumed to true.
- A Nutrition Facts label: kind "label". Copy the per-serving numbers exactly as printed into ONE item labeled with the product name if visible,
  and copy the serving size into servingSize.
- Nothing edible: kind "none" with no items. Round to whole numbers.`;

export async function estimateFood(input: { text?: string; image?: { mediaType: "image/jpeg" | "image/png" | "image/webp"; data: string } }): Promise<FoodEstimate> {
  if (mockMode()) return mock.food(input.text ?? "", !!input.image);
  const content: Anthropic.Beta.BetaContentBlockParam[] = [];
  if (input.image) content.push({ type: "image", source: { type: "base64", media_type: input.image.mediaType, data: input.image.data } });
  content.push({ type: "text", text: input.text?.trim() ? input.text.trim() : "What's in this photo? Estimate its nutrition." });
  const { data } = await ask(FoodEstimate, { system: FOOD_SYSTEM, messages: [{ role: "user", content }], effort: "low", maxTokens: 3000, model: FAST_MODEL });
  return { ...data, items: data.items.filter((i) => i.calories >= 0 && i.calories <= 3000).slice(0, 15) };
}
