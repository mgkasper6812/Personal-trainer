import Anthropic from "@anthropic-ai/sdk";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import type { z } from "zod";
import { db } from "./db";
import { DailyPlan, OnboardingTurn, Profile, Program } from "./schemas";
import { PROFILE_EXTRACT_SYSTEM, coachSystem, onboardingSystem, programInstructions } from "./prompts";
import * as mock from "./mock";
import type { CheckIn, Role } from "./types";

export const MODEL = process.env.COACH_MODEL ?? "claude-opus-5-5";

export class CoachError extends Error {}

type Effort = "low" | "medium" | "high";
type Msg = Anthropic.Beta.BetaMessageParam;

let _client: Anthropic | undefined;
const client = () => (_client ??= new Anthropic());

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

async function recordUsage(model: string, u: Anthropic.Beta.BetaUsage) {
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
  opts: { system: string; messages: Msg[]; effort: Effort; maxTokens?: number },
): Promise<{ data: z.infer<S>; content: Anthropic.Beta.BetaContentBlockParam[] }> {
  let res;
  try {
    // Streamed so long answers (like a full program) don't hit the SDK's non-streaming limit.
    res = await client().beta.messages.stream({
      model: MODEL,
      max_tokens: opts.maxTokens ?? 16000,
      system: [{ type: "text", text: opts.system, cache_control: { type: "ephemeral" } }],
      messages: opts.messages,
      output_config: { effort: opts.effort, format: betaZodOutputFormat(schema) },
      // If a safety classifier declines, retry server-side on Anthropic's recommended fallback model.
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
    }).finalMessage();
  } catch (e) {
    if (e instanceof Anthropic.RateLimitError) throw new CoachError("The coach is busy right now. Try again in a minute.");
    if (e instanceof Anthropic.AuthenticationError) throw new CoachError("The Claude API key is missing or invalid.");
    if (e instanceof Anthropic.APIConnectionError) throw new CoachError("Couldn't reach the coach. Check your connection.");
    if (e instanceof Anthropic.APIError) throw new CoachError(`Coach error (${e.status}). Try again.`);
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

// ---------------- Onboarding ----------------

export type OnboardingState = { messages: Msg[]; display: { role: "coach" | "me"; text: string }[]; complete: boolean };

export async function onboardingTurn(role: Role, name: string, state: OnboardingState, userText: string | null) {
  const messages: Msg[] = [...state.messages];
  if (userText === null) {
    messages.push({ role: "user", content: `Hi, I'm ${name}. Let's get set up.` });
  } else {
    messages.push({ role: "user", content: userText });
  }
  const { data, content } = mockMode()
    ? { data: mock.onboarding(role, state.display.length), content: [] as Anthropic.Beta.BetaContentBlockParam[] }
    : await ask(OnboardingTurn, { system: onboardingSystem(role), messages, effort: "low", maxTokens: 4000 });
  messages.push({ role: "assistant", content: content.length ? content : [{ type: "text", text: JSON.stringify(data) }] });
  // A message that still asks a question can't end setup.
  const complete = data.complete && !data.message.includes("?");
  const display = [...state.display];
  if (userText !== null) display.push({ role: "me", text: userText });
  display.push({ role: "coach", text: data.message });
  return { messages, display, complete } satisfies OnboardingState;
}

export async function extractProfile(role: Role, display: OnboardingState["display"]): Promise<Profile> {
  if (mockMode()) return mock.profile(role);
  const transcript = display.map((m) => `${m.role === "coach" ? "Coach" : "Them"}: ${m.text}`).join("\n");
  const { data } = await ask(Profile, {
    system: PROFILE_EXTRACT_SYSTEM,
    messages: [{ role: "user", content: `Role: ${role}\n\n${transcript}` }],
    effort: "low",
    maxTokens: 8000,
  });
  return data;
}

// ---------------- Program ----------------

export async function generateProgram(role: Role, profile: Profile, startDate: string): Promise<Program> {
  if (mockMode()) return mock.program(role);
  const { data } = await ask(Program, {
    system: coachSystem(role),
    messages: [
      {
        role: "user",
        content: `${programInstructions(role)}\n\nBlock 1 starts ${startDate} (a Monday).\n\nProfile:\n${JSON.stringify(profile, null, 2)}`,
      },
    ],
    effort: "high",
    maxTokens: 32000,
  });
  return data;
}

// ---------------- Daily plan ----------------

export async function generateDailyPlan(input: {
  role: Role;
  date: string;
  weekday: string;
  blockWeek: number;
  profile: Profile;
  program: Program;
  checkIn: CheckIn | null;
  recent: { date: string; checkIn: CheckIn | null; completed: string }[];
}): Promise<DailyPlan> {
  if (mockMode()) return mock.dailyPlan(input.role, input.checkIn);
  const dow = new Date(`${input.date}T12:00:00`).getDay();
  const template = input.program.weeklyTemplate.find((d) => d.dayOfWeek === dow) ?? null;
  const week = input.program.weeks.find((w) => w.week === input.blockWeek) ?? null;
  const { data } = await ask(DailyPlan, {
    system: coachSystem(input.role),
    messages: [
      {
        role: "user",
        content: [
          `Write today's plan for ${input.weekday} ${input.date}. Start from the program's template for today and this week's progression,`,
          `then adjust for today's check-in and the last week. Keep it doable in the time available. Every item must be a concrete`,
          `action they can check off. ${input.role === "athlete" ? "meals must be null; give a fueling tip." : "Include the meal plan; fueling must be null."}`,
          `If the check-in reports pain, follow the pain rule and say so plainly in the coach note.`,
          ``,
          `Block week: ${input.blockWeek} of ${input.program.blockWeeks}${week ? ` — ${week.theme}: ${week.progression}${week.deload ? " (deload)" : ""}` : " (block finished — keep training sensibly and remind them a new block is due)"}`,
          `Today's template: ${template ? JSON.stringify(template) : "none — treat as rest/recovery"}`,
          `Today's check-in: ${input.checkIn ? JSON.stringify(input.checkIn) : "not done yet"}`,
          `Last 7 days: ${JSON.stringify(input.recent)}`,
          `Standing rules: ${JSON.stringify(input.program.rules)}`,
          input.program.nutrition ? `Nutrition targets: ${JSON.stringify(input.program.nutrition)}` : "",
          `Profile: ${JSON.stringify(input.profile)}`,
        ].join("\n"),
      },
    ],
    effort: "medium",
    maxTokens: 16000,
  });
  return data;
}
