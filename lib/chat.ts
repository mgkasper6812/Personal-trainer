import Anthropic from "@anthropic-ai/sdk";
import { CoachError, MODEL, client, mockMode, recordUsage } from "./coach";
import {
  addAlert, getCheckIn, getCustomHabits, getHabitLog, getHealthBio, getMealPlan, getProfile, getProgram, getProteinLog,
  getRecipe, getWeights, getYesterdayCheckIn, listRecipes, listWorkouts, saveCustomHabits, saveMealPlan, saveProgram, saveProteinLog,
} from "./data";
import { db } from "./db";
import { addDays, mondayOf, weekdayName } from "./dates";
import { EXERCISES, getExercise } from "./exercises";
import { coachSystem } from "./prompts";
import { evaluate } from "./rules";
import type { User } from "./types";

type Msg = Anthropic.Beta.BetaMessageParam;
export type ChatLine = { role: "me" | "coach"; text: string; actions?: string[]; at: string };
export type ChatState = { messages: Msg[]; display: ChatLine[] };

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
export const getChat = async (uid: string) => (await db().get<ChatState>(`chat:${uid}`)) ?? { messages: [], display: [] };
const saveChat = (uid: string, c: ChatState) => db().set(`chat:${uid}`, c);

const CHAT_RULES = `
You are chatting inside the family's training app. Reply in 2–4 short sentences unless asked for more; use a short list only
when it really helps. Ground answers in the context block that comes with each message (cite a number when you can). If the
context doesn't have something, say so — never invent data. When the user asks you to change something the tools cover, call
the tool, then confirm exactly what changed. Never claim a change you didn't make. For medical questions, give general guidance
and point to their doctor. Exercise ids you may use with swap_exercise: ${EXERCISES.map((e) => e.id).join(", ")}.`;

function tools(role: User["role"]): Anthropic.Beta.BetaTool[] {
  const t: Anthropic.Beta.BetaTool[] = [
    {
      name: "set_day_plan",
      description: "Change what's scheduled on a weekday in the user's program: a named routine, a rest day, or a busy day (walk only). Use routine name 'Zone 2 Cardio' to create/use a Zone 2 cardio session.",
      strict: true,
      input_schema: { type: "object", additionalProperties: false, required: ["day", "mode", "routine_name"], properties: {
        day: { type: "string", enum: DAYS }, mode: { type: "string", enum: ["routine", "rest", "busy"] },
        routine_name: { type: ["string", "null"], description: "Existing routine name when mode is routine" },
      } },
    },
    {
      name: "swap_exercise",
      description: "Replace one exercise in a routine with another from the exercise library (by id). Keeps sets and rest.",
      strict: true,
      input_schema: { type: "object", additionalProperties: false, required: ["routine_name", "from_exercise", "to_exercise_id"], properties: {
        routine_name: { type: "string" }, from_exercise: { type: "string", description: "Name or id of the exercise to replace" },
        to_exercise_id: { type: "string" },
      } },
    },
    {
      name: "add_habit",
      description: "Add a daily habit to the user's checklist.",
      strict: true,
      input_schema: { type: "object", additionalProperties: false, required: ["name"], properties: { name: { type: "string" } } },
    },
  ];
  if (role === "parent") t.push(
    {
      name: "log_protein",
      description: "Log protein the user ate today. Estimate grams per item if they didn't say.",
      strict: true,
      input_schema: { type: "object", additionalProperties: false, required: ["items"], properties: {
        items: { type: "array", items: { type: "object", additionalProperties: false, required: ["label", "grams"], properties: { label: { type: "string" }, grams: { type: "integer" } } } },
      } },
    },
    {
      name: "plan_dinner",
      description: "Put a recipe from the family recipe library on a day this week (or clear the day with recipe_title null).",
      strict: true,
      input_schema: { type: "object", additionalProperties: false, required: ["day", "recipe_title"], properties: {
        day: { type: "string", enum: DAYS }, recipe_title: { type: ["string", "null"] },
      } },
    },
  );
  else t.push({
    name: "report_pain",
    description: "Call whenever the athlete mentions pain (not ordinary soreness). Alerts her parent.",
    strict: true,
    input_schema: { type: "object", additionalProperties: false, required: ["region", "level", "description", "with_throwing"], properties: {
      region: { type: "string" }, level: { type: "integer", description: "0-10" }, description: { type: "string" }, with_throwing: { type: "boolean" },
    } },
  });
  return t;
}

/** A compact snapshot of today, sent with every message so the coach answers from real data. */
async function context(user: User, date: string) {
  const [profile, rec, checkIn, yesterday, workouts, habits, habitLog] = await Promise.all([
    getProfile(user.id), getProgram(user.id), getCheckIn(user.id, date), getYesterdayCheckIn(user.id, date),
    listWorkouts(user.id), getCustomHabits(user.id), getHabitLog(user.id, date),
  ]);
  const p = rec?.program;
  const dow = new Date(`${date}T12:00:00Z`).getUTCDay();
  const slot = p?.schedule.find((s) => s.dayOfWeek === dow);
  const routine = slot?.routineKey ? p!.routines.find((r) => r.key === slot.routineKey) ?? null : null;
  const readiness = profile && checkIn ? evaluate(profile, user.name, checkIn, yesterday, routine) : null;
  const ctx: Record<string, unknown> = {
    today: `${weekdayName(date)} ${date}`,
    program: p ? { title: p.title, startDate: rec!.startDate, rules: p.rules } : null,
    schedule: p?.schedule.map((s) => `${DAYS[s.dayOfWeek]}: ${s.routineKey ? p.routines.find((r) => r.key === s.routineKey)?.name : s.note ?? "Rest"}`),
    routines: p?.routines.map((r) => ({ name: r.name, exercises: r.exercises.map((e) => `${getExercise(e.exerciseId)?.name} ${e.sets}x${e.repsMin ?? e.seconds ?? e.minutes ?? e.count ?? ""}`) })),
    todaysSession: routine?.name ?? slot?.note ?? "Rest",
    checkIn: checkIn ? { ...checkIn, note: undefined } : "not done",
    readiness: readiness ? { status: readiness.status, reasons: readiness.reasons } : null,
    recentWorkouts: workouts.slice(0, 5).map((w) => `${w.date} ${w.name} (${w.sets} sets${w.prs ? `, ${w.prs} PR` : ""})`),
    habits: { list: [...(p?.dailyHabits ?? []), ...habits], doneToday: habitLog },
    profile,
  };
  if (user.role === "parent") {
    const monday = mondayOf(date);
    const [bio, protein, plan, weights] = await Promise.all([getHealthBio(user.id), getProteinLog(user.id, date), getMealPlan(user.id, monday), getWeights(user.id)]);
    const dinners = await Promise.all(Array.from({ length: 7 }, (_, i) => addDays(monday, i)).map(async (d) => {
      const id = plan.days[d];
      return `${DAYS[new Date(`${d}T12:00:00Z`).getUTCDay()]}: ${id ? (await getRecipe(id))?.title ?? "?" : "not planned"}`;
    }));
    ctx.healthBio = bio ? { ...bio, updatedAt: undefined } : null;
    ctx.nutrition = p?.nutrition ?? null;
    ctx.proteinToday = { total: protein.reduce((a, e) => a + e.grams, 0), target: p?.nutrition?.proteinG ?? null, items: protein.map((e) => `${e.label} ${e.grams}g`) };
    ctx.dinnersThisWeek = dinners;
    ctx.recipeLibrary = (await listRecipes()).slice(0, 40).map((r) => r.title);
    ctx.recentWeights = weights.slice(-10);
  }
  return ctx;
}

async function runTool(user: User, date: string, name: string, input: Record<string, unknown>): Promise<{ result: string; action?: string }> {
  const dayIndex = (d: unknown) => DAYS.indexOf(String(d));
  if (name === "set_day_plan") {
    const rec = await getProgram(user.id);
    if (!rec) return { result: "No program yet." };
    const d = dayIndex(input.day);
    if (d < 0) return { result: "Unknown day." };
    let key: string | null = null;
    if (input.mode === "routine") {
      const want = String(input.routine_name ?? "").toLowerCase();
      let r = rec.program.routines.find((x) => x.name.toLowerCase() === want) ?? rec.program.routines.find((x) => x.name.toLowerCase().includes(want) && want);
      if (!r && want.includes("zone 2")) {
        r = { key: "zone-2-cardio", name: "Zone 2 Cardio", purpose: "Easy, steady cardio — improves insulin sensitivity and heart health.", estMinutes: 40,
          exercises: [{ exerciseId: "zone2_cardio", sets: 1, warmupSets: 0, repsMin: null, repsMax: null, seconds: null, minutes: 40, count: null, weightLb: null, targetRpe: null, tempo: null, restSec: 0, superset: null, notes: "Conversational pace. Watch: stay in Zone 2." }] };
        rec.program.routines.push(r);
      }
      if (!r) return { result: `No routine named "${input.routine_name}". Existing: ${rec.program.routines.map((x) => x.name).join(", ")}.` };
      key = r.key;
    }
    const note = input.mode === "busy" ? "Busy — walk only" : input.mode === "rest" ? "Rest" : null;
    rec.program.schedule = rec.program.schedule.map((s) => (s.dayOfWeek === d ? { ...s, routineKey: key, note } : s));
    await saveProgram(user.id, rec);
    const label = key ? rec.program.routines.find((x) => x.key === key)!.name : note;
    return { result: `Done: ${DAYS[d]} is now ${label}.`, action: `${DAYS[d]} → ${label}` };
  }
  if (name === "swap_exercise") {
    const rec = await getProgram(user.id);
    const to = getExercise(String(input.to_exercise_id));
    if (!rec || !to) return { result: "Unknown routine or exercise id." };
    const r = rec.program.routines.find((x) => x.name.toLowerCase() === String(input.routine_name).toLowerCase());
    if (!r) return { result: `No routine named "${input.routine_name}".` };
    const from = String(input.from_exercise).toLowerCase();
    const i = r.exercises.findIndex((e) => e.exerciseId === from || getExercise(e.exerciseId)?.name.toLowerCase().includes(from));
    if (i < 0) return { result: `"${input.from_exercise}" isn't in ${r.name}.` };
    const old = getExercise(r.exercises[i].exerciseId)?.name;
    r.exercises[i] = { ...r.exercises[i], exerciseId: to.id };
    await saveProgram(user.id, rec);
    return { result: `Swapped ${old} for ${to.name} in ${r.name}.`, action: `${r.name}: ${old} → ${to.name}` };
  }
  if (name === "add_habit") {
    const h = String(input.name).trim().slice(0, 60);
    const list = await getCustomHabits(user.id);
    if (h && !list.includes(h)) await saveCustomHabits(user.id, [...list, h].slice(0, 12));
    return { result: `Added habit "${h}".`, action: `New habit: ${h}` };
  }
  if (name === "log_protein" && user.role === "parent") {
    const items = (Array.isArray(input.items) ? input.items : []).slice(0, 15)
      .map((x: { label?: unknown; grams?: unknown }) => ({ label: String(x.label ?? "").slice(0, 60), grams: Math.round(Number(x.grams)) }))
      .filter((x) => x.label && x.grams > 0 && x.grams <= 300);
    const log = await getProteinLog(user.id, date);
    await saveProteinLog(user.id, date, [...log, ...items.map((x) => ({ id: crypto.randomUUID().slice(0, 8), ...x, at: new Date().toISOString() }))].slice(-40));
    const g = items.reduce((a, x) => a + x.grams, 0);
    return { result: `Logged ${g} g (${items.map((x) => `${x.label} ${x.grams}g`).join(", ")}).`, action: `+${g} g protein` };
  }
  if (name === "plan_dinner" && user.role === "parent") {
    const monday = mondayOf(date);
    const d = dayIndex(input.day);
    if (d < 0) return { result: "Unknown day." };
    const dayDate = addDays(monday, (d + 6) % 7);
    const plan = await getMealPlan(user.id, monday);
    if (input.recipe_title === null) {
      plan.days[dayDate] = null;
      await saveMealPlan(user.id, plan);
      return { result: `Cleared ${DAYS[d]} dinner.`, action: `${DAYS[d]} dinner cleared` };
    }
    const want = String(input.recipe_title).toLowerCase();
    const lib = await listRecipes();
    const r = lib.find((x) => x.title.toLowerCase() === want) ?? lib.find((x) => x.title.toLowerCase().includes(want));
    if (!r) return { result: `No recipe like "${input.recipe_title}" in the library.` };
    plan.days[dayDate] = r.id;
    await saveMealPlan(user.id, plan);
    return { result: `${DAYS[d]} dinner: ${r.title}.`, action: `${DAYS[d]} dinner → ${r.title}` };
  }
  if (name === "report_pain" && user.role === "athlete") {
    await addAlert({ athleteId: user.id, athleteName: user.name, date, level: Number(input.level) >= 6 ? "urgent" : "warn",
      message: `${user.name} told her coach: ${String(input.region)} pain ${input.level}/10${input.with_throwing ? " when throwing" : ""} — "${String(input.description).slice(0, 160)}".` });
    return { result: "Her dad has been alerted. Tell her to stop anything that hurts, tell her dad, and log it in today's check-in.", action: "Dad alerted" };
  }
  return { result: "That action isn't available." };
}

/** One chat turn: append the user's message (with today's context), run the tool loop, save append-only history. */
export async function chatTurn(user: User, text: string, date: string): Promise<ChatState> {
  const state = await getChat(user.id);
  const now = new Date().toISOString();
  state.display.push({ role: "me", text, at: now });
  const ctx = await context(user, date);
  const messages: Msg[] = [...state.messages, {
    role: "user",
    content: [{ type: "text", text: `<context>\n${JSON.stringify(ctx)}\n</context>` }, { type: "text", text }],
  }];
  const actions: string[] = [];
  let reply = "";

  if (mockMode()) {
    if (/thursday/i.test(text) && /zone/i.test(text)) actions.push((await runTool(user, date, "set_day_plan", { day: "Thu", mode: "routine", routine_name: "Zone 2 Cardio" })).action!);
    reply = actions.length ? "Done — Thursday is now Zone 2 Cardio. Keep it conversational, about 40 minutes." : "Got it. (Coach is in test mode.)";
    messages.push({ role: "assistant", content: [{ type: "text", text: reply }] });
  } else {
    const system = [{ type: "text" as const, text: `${coachSystem(user.role)}\n${CHAT_RULES}`, cache_control: { type: "ephemeral" as const } }];
    for (let i = 0; i < 6; i++) {
      let res: Anthropic.Beta.BetaMessage;
      try {
        res = await client().beta.messages.stream({
          model: MODEL, max_tokens: 8000, system, tools: tools(user.role), messages,
          output_config: { effort: "low" },
          betas: ["server-side-fallback-2026-07-01"], fallbacks: "default",
        }).finalMessage();
      } catch (e) {
        if (e instanceof Anthropic.RateLimitError) throw new CoachError("The coach is busy right now. Try again in a minute.");
        if (e instanceof Anthropic.APIError) {
          console.error("Claude API error (chat)", e.status, e.message);
          throw new CoachError(`Coach error (${e.status}): ${String(e.message).slice(0, 220)}`);
        }
        if (e instanceof Anthropic.AnthropicError) throw new CoachError(`Coach error: ${e.message}`);
        throw e;
      }
      await recordUsage(res.model, res.usage);
      if (res.stop_reason === "refusal") { reply = "I can't help with that one. Try asking another way."; break; }
      messages.push({ role: "assistant", content: res.content as Anthropic.Beta.BetaContentBlockParam[] });
      const uses = res.content.filter((b): b is Anthropic.Beta.BetaToolUseBlock => b.type === "tool_use");
      const text = res.content.filter((b): b is Anthropic.Beta.BetaTextBlock => b.type === "text").map((b) => b.text).join("\n").trim();
      if (text) reply = text;
      if (res.stop_reason !== "tool_use" || !uses.length) break;
      const results: Anthropic.Beta.BetaToolResultBlockParam[] = [];
      for (const u of uses) {
        try {
          const r = await runTool(user, date, u.name, (u.input ?? {}) as Record<string, unknown>);
          if (r.action) actions.push(r.action);
          results.push({ type: "tool_result", tool_use_id: u.id, content: r.result });
        } catch (e) {
          results.push({ type: "tool_result", tool_use_id: u.id, content: `Failed: ${(e as Error).message}`, is_error: true });
        }
      }
      messages.push({ role: "user", content: results });
    }
  }

  state.display.push({ role: "coach", text: reply || "Done.", actions: actions.length ? actions : undefined, at: new Date().toISOString() });
  // Keep history bounded: drop whole turns from the front only (never edit the middle).
  let start = 0;
  while (messages.length - start > 80) {
    const next = messages.findIndex((m, j) => j > start && m.role === "user" && Array.isArray(m.content) && m.content.some((b) => b.type === "text"));
    if (next < 0) break;
    start = next;
  }
  state.messages = messages.slice(start);
  state.display = state.display.slice(-200);
  await saveChat(user.id, state);
  return state;
}
