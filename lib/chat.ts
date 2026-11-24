import Anthropic from "@anthropic-ai/sdk";
import { CoachError, MODEL, client, mockMode, recordUsage } from "./coach";
import {
  addAlert, getCheckIn, getCustomHabits, getHabitLog, getHealthBio, getMealPlan, getProfile, getProgram, getProteinLog,
  getRecipe, getWeights, getYesterdayCheckIn, listRecipes, getWorkout, listWorkouts, saveCustomHabits, saveMealPlan, saveProgram, saveProteinLog,
} from "./data";
import { db } from "./db";
import { addDays, isDate, mondayOf, weekdayName } from "./dates";
import { EXERCISES, getExercise } from "./exercises";
import { coachSystem } from "./prompts";
import { evaluate } from "./rules";
import type { LoggedExercise, User, Workout } from "./types";
import { saveWorkout } from "./workout-save";
import { cardioExerciseFor, cardioSet } from "./cardio";

type Msg = Anthropic.Beta.BetaMessageParam;
export type ChatLine = { role: "me" | "coach"; text: string; actions?: string[]; at: string; kind?: "review" | "nudge" | "workout"; replies?: string[]; photos?: number };
export type ChatImage = { mediaType: "image/jpeg" | "image/png" | "image/webp"; data: string };
export type ChatState = { messages: Msg[]; display: ChatLine[]; pending?: string[]; lastSeen?: string };

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
export const getChat = async (uid: string) => (await db().get<ChatState>(`chat:${uid}`)) ?? { messages: [], display: [] };
const saveChat = (uid: string, c: ChatState) => db().set(`chat:${uid}`, c);

/** The coach starts a conversation: shown in the chat, and passed to the model with the user's next message. */
export async function postCoachMessage(uid: string, text: string, kind: ChatLine["kind"], replies: string[] = []) {
  const state = await getChat(uid);
  state.display.push({ role: "coach", text, kind, replies: replies.slice(0, 3), at: new Date().toISOString() });
  state.display = state.display.slice(-200);
  state.pending = [...(state.pending ?? []), text].slice(-6);
  await saveChat(uid, state);
}

export async function markSeen(uid: string) {
  const state = await getChat(uid);
  state.lastSeen = new Date().toISOString();
  await saveChat(uid, state);
  return state;
}

export const unreadCount = (state: ChatState) =>
  state.display.filter((l) => l.role === "coach" && (!state.lastSeen || l.at > state.lastSeen)).length;

/** Pull a trailing "Suggestions: a | b | c" line off a reply. */
function splitReplies(text: string): { text: string; replies: string[] } {
  const m = text.match(/\n*\s*Suggestions?:\s*(.+)\s*$/i);
  if (!m) return { text, replies: [] };
  return { text: text.slice(0, m.index).trim(), replies: m[1].split("|").map((x) => x.trim().replace(/^["']|["']$/g, "")).filter(Boolean).slice(0, 3) };
}

const CHAT_RULES = `
You are chatting inside the family's training app. Reply in 2–4 short sentences unless asked for more; use a short list only
when it really helps. Ground answers in the context block that comes with each message (cite a number when you can). If the
context doesn't have something, say so — never invent data. When the user asks you to change something the tools cover, call
the tool, then confirm exactly what changed. Never claim a change you didn't make. For medical questions, give general guidance
and point to their doctor. Act like a real coach: notice patterns, give specific advice and suggestions (what to eat next, how to adjust a
session, how to prep for tonight), ask a short follow-up question when it helps, and hold them to what they said they'd do.
LOGGING WORKOUTS: when they tell you about a workout they did ("did Strength A, squats 3x8 at 185…", "walked 30 min") or send a
workout screenshot (Apple Fitness, Strava, Watch), call log_workout. If the day's workout is already logged (recentWorkouts) and they
are sending its heart-rate or cardio numbers, use add_to_existing. Log only what they said or showed; if key details are missing for a
lift (weights, reps), log what you have and ask. After logging, react like a coach: one specific note on the effort or the numbers.
PHOTOS: the user can attach up to 4 photos. Look at them carefully and say what you see. Food (a plate, a menu, a restaurant
dish, a package or a Nutrition Facts label): name each item with an estimated portion and its nutrition, then say how it fits what's
left for today from foodToday (cite the remaining numbers) and suggest a better swap or portion if one helps. Several photos of one meal
are the same meal — never count a food twice; if a label matches a pictured food, use the label's numbers. Only call log_food when they
say they ate it or ask you to log it; otherwise offer to (put "Log it" in the suggestions). Workout screenshots, form photos, gym
equipment or anything else: answer about what's actually in the picture. If a photo is unclear, say what you'd need to see.
End EVERY reply with a final line exactly like: "Suggestions: <reply 1> | <reply 2> | <reply 3>" — 2–3 short things the user might say next.
Exercise ids you may use with swap_exercise: ${EXERCISES.map((e) => e.id).join(", ")}.`;

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
    {
      name: "log_workout",
      description: "Log a workout the user did (described in words or shown in a screenshot), or add heart-rate/cardio numbers to a workout already logged that day. Use 0 for any number you don't know; never invent sets they didn't mention.",
      strict: true,
      input_schema: { type: "object", additionalProperties: false,
        required: ["date", "name", "routine_name", "duration_min", "exercises", "avg_hr", "max_hr", "calories", "distance_mi", "add_to_existing", "notes"],
        properties: {
          date: { type: "string", description: "YYYY-MM-DD (today's date from context unless they said otherwise)" },
          name: { type: "string", description: "e.g. 'Strength A', 'Zone 2 bike', 'Evening walk'" },
          routine_name: { type: "string", description: "The program routine this was, if any (exact name from context), else ''" },
          duration_min: { type: "number" },
          exercises: { type: "array", items: { type: "object", additionalProperties: false, required: ["exercise_id", "notes", "sets"], properties: {
            exercise_id: { type: "string", description: "An id from the exercise list in your instructions; other_cardio for cardio that doesn't fit" },
            notes: { type: "string" },
            sets: { type: "array", items: { type: "object", additionalProperties: false, required: ["reps", "weight_lb", "minutes", "seconds", "miles", "avg_hr"], properties: {
              reps: { type: "integer" }, weight_lb: { type: "number" }, minutes: { type: "number" }, seconds: { type: "integer" },
              miles: { type: "number", description: "Cardio distance" }, avg_hr: { type: "integer", description: "Cardio average heart rate" },
            } } },
          } } },
          avg_hr: { type: "integer" }, max_hr: { type: "integer" }, calories: { type: "integer", description: "Active calories" }, distance_mi: { type: "number" },
          add_to_existing: { type: "boolean", description: "True to add these heart-rate/cardio numbers (and any exercises) to the most recent workout already logged on that date instead of creating a new one" },
          notes: { type: "string" },
        } },
    },
  ];
  if (role === "parent") t.push(
    {
      name: "log_food",
      description: "Log food the user ate today with estimated nutrition per item (estimate if they didn't say).",
      strict: true,
      input_schema: { type: "object", additionalProperties: false, required: ["meal", "items"], properties: {
        meal: { type: "string", enum: ["breakfast", "lunch", "dinner", "snack"] },
        items: { type: "array", items: { type: "object", additionalProperties: false, required: ["label", "calories", "protein_g", "carbs_g", "fiber_g", "fat_g"], properties: {
          label: { type: "string" }, calories: { type: "integer" }, protein_g: { type: "integer" }, carbs_g: { type: "integer" }, fiber_g: { type: "integer" }, fat_g: { type: "integer" },
        } } },
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
    recentWorkouts: workouts.slice(0, 5).map((w) => `${w.date} ${w.name} (${w.sets} sets${w.prs ? `, ${w.prs} PR` : ""}${w.watch ? ", has heart-rate data" : ", no heart-rate data"})`),
    habits: { list: [...(p?.dailyHabits ?? []), ...habits], doneToday: habitLog },
    profile,
  };
  try {
    const rv = await db().get<{ grade: string; headline: string; todayFocus: string[] }>(`review:${user.id}:${addDays(date, -1)}`);
    if (rv) ctx.yesterdaysReport = { grade: rv.grade, headline: rv.headline, todayFocus: rv.todayFocus };
  } catch {}
  if (user.role === "parent") {
    const monday = mondayOf(date);
    const [bio, protein, plan, weights] = await Promise.all([getHealthBio(user.id), getProteinLog(user.id, date), getMealPlan(user.id, monday), getWeights(user.id)]);
    const dinners = await Promise.all(Array.from({ length: 7 }, (_, i) => addDays(monday, i)).map(async (d) => {
      const id = plan.days[d];
      return `${DAYS[new Date(`${d}T12:00:00Z`).getUTCDay()]}: ${id ? (await getRecipe(id))?.title ?? "?" : "not planned"}`;
    }));
    ctx.healthBio = bio ? { ...bio, updatedAt: undefined } : null;
    ctx.nutrition = p?.nutrition ?? null;
    ctx.foodToday = {
      totals: { calories: protein.reduce((a, e) => a + (e.calories ?? 0), 0), protein: protein.reduce((a, e) => a + e.grams, 0), carbs: protein.reduce((a, e) => a + (e.carbsG ?? 0), 0), fiber: protein.reduce((a, e) => a + (e.fiberG ?? 0), 0) },
      targets: { calories: p?.nutrition?.calories ?? null, protein: p?.nutrition?.proteinG ?? null },
      items: protein.map((e) => `${e.meal ?? "?"}: ${e.label} (${e.calories ?? "?"} cal, ${e.grams}g P, ${e.carbsG ?? "?"}g C)`),
    };
    ctx.dinnersThisWeek = dinners;
    ctx.recipeLibrary = (await listRecipes()).slice(0, 40).map((r) => r.title);
    ctx.recentWeights = weights.slice(-10);
  }
  return ctx;
}

async function runTool(user: User, date: string, name: string, input: Record<string, unknown>): Promise<{ result: string; action?: string }> {
  const dayIndex = (d: unknown) => DAYS.indexOf(String(d));
  if (name === "log_workout") return logWorkoutTool(user, date, input);
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
  if (name === "log_food" && user.role === "parent") {
    const meal = (["breakfast", "lunch", "dinner", "snack"] as const).find((m) => m === input.meal) ?? "snack";
    const num = (v: unknown, max: number) => { const x = Math.round(Number(v)); return Number.isFinite(x) && x >= 0 && x <= max ? x : 0; };
    const items = (Array.isArray(input.items) ? input.items : []).slice(0, 15)
      .map((x: Record<string, unknown>) => ({ label: String(x.label ?? "").slice(0, 60), grams: num(x.protein_g, 300), calories: num(x.calories, 3000), carbsG: num(x.carbs_g, 500), fiberG: num(x.fiber_g, 150), fatG: num(x.fat_g, 300) }))
      .filter((x) => x.label);
    const log = await getProteinLog(user.id, date);
    await saveProteinLog(user.id, date, [...log, ...items.map((x) => ({ id: crypto.randomUUID().slice(0, 8), ...x, meal, at: new Date().toISOString() }))].slice(-60));
    const cal = items.reduce((a, x) => a + x.calories, 0), g = items.reduce((a, x) => a + x.grams, 0);
    return { result: `Logged ${meal}: ${items.map((x) => x.label).join(", ")} — ${cal} cal, ${g} g protein.`, action: `${meal}: +${cal} cal · ${g} g protein` };
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
export async function chatTurn(user: User, text: string, date: string, images: ChatImage[] = []): Promise<ChatState> {
  const state = await getChat(user.id);
  const now = new Date().toISOString();
  state.display.push({ role: "me", text, at: now, photos: images.length || undefined });
  const ctx = await context(user, date);
  if (state.pending?.length) { ctx.coachMessagesYouSentSinceLastReply = state.pending; state.pending = []; }
  const photoBlocks: Anthropic.Beta.BetaContentBlockParam[] = images.flatMap((img, i) => [
    ...(images.length > 1 ? [{ type: "text" as const, text: `Photo ${i + 1}:` }] : []),
    { type: "image" as const, source: { type: "base64" as const, media_type: img.mediaType, data: img.data } },
  ]);
  const turn: Msg = {
    role: "user",
    content: [{ type: "text", text: `<context>\n${JSON.stringify(ctx)}\n</context>` }, ...photoBlocks, { type: "text", text }],
  };
  const messages: Msg[] = [...state.messages, turn];
  const actions: string[] = [];
  let reply = "";

  if (mockMode()) {
    if (/\b(log|did|finished|logged|add)\b/i.test(text) && /(workout|walk|run|bike|squat|lift|cardio|heart rate|hr)/i.test(text)) {
      const add = /heart rate|\bhr\b|add .* to/i.test(text);
      actions.push((await runTool(user, date, "log_workout", add
        ? { date, name: "", routine_name: "", duration_min: 32, exercises: [], avg_hr: 128, max_hr: 151, calories: 310, distance_mi: 0, add_to_existing: true, notes: "" }
        : { date, name: "Evening walk", routine_name: "", duration_min: 30, exercises: [{ exercise_id: "brisk_walk", notes: "", sets: [{ reps: 0, weight_lb: 0, minutes: 30, seconds: 0, miles: 0, avg_hr: 0 }] }], avg_hr: 112, max_hr: 131, calories: 180, distance_mi: 1.7, add_to_existing: false, notes: "" })).action ?? "Nothing logged");
    }
    if (/thursday/i.test(text) && /zone/i.test(text)) actions.push((await runTool(user, date, "set_day_plan", { day: "Thu", mode: "routine", routine_name: "Zone 2 Cardio" })).action!);
    reply = (actions.some((a) => /workout|Added/.test(a)) ? `${actions[0]}. Nice work — keep that heart rate conversational on easy days. (Coach is in test mode.)`
      : actions.length ? "Done — Thursday is now Zone 2 Cardio. Keep it conversational, about 40 minutes."
      : images.length ? `I see ${images.length} photo${images.length > 1 ? "s" : ""}: grilled chicken (~6 oz, 50 g protein, 280 cal) and rice (~1 cup, 45 g carbs, 210 cal). That leaves you about 60 g of protein for the day. (Coach is in test mode.)`
      : "Got it. (Coach is in test mode.)")
      + "\nSuggestions: What should I eat tonight? | Adjust today's workout | How am I doing this week?";
    messages.push({ role: "assistant", content: [{ type: "text", text: reply }] });
  } else {
    const athletePhotos = user.role === "athlete"
      ? "\nFor the athlete's food photos: talk about fueling for performance only (protein for recovery, carbs for energy, hydration, timing around practice) — never calories, weight or body size."
      : "";
    const system = [{ type: "text" as const, text: `${coachSystem(user.role)}\n${CHAT_RULES}${athletePhotos}`, cache_control: { type: "ephemeral" as const } }];
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

  // Photos are sent once, for this turn only: keep a short note in the saved history instead of the image data.
  if (images.length) turn.content = (turn.content as Anthropic.Beta.BetaContentBlockParam[]).filter((b) => b.type !== "image")
    .map((b) => (b.type === "text" && /^Photo \d+:$/.test(b.text) ? { ...b, text: `${b.text} [image no longer attached — see your reply for what it showed]` } : b))
    .concat(images.length === 1 ? [{ type: "text", text: "[The user attached a photo here; it is no longer attached — see your reply for what it showed.]" }] : []);
  const split = splitReplies(reply || "Done.");
  state.display.push({ role: "coach", text: split.text || "Done.", actions: actions.length ? actions : undefined, replies: split.replies.length ? split.replies : undefined, at: new Date().toISOString() });
  state.lastSeen = new Date().toISOString();
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

/** The coach's log_workout tool: a new workout, or heart-rate/cardio numbers (and extra exercises) added to one already logged. */
async function logWorkoutTool(user: User, today: string, input: Record<string, unknown>): Promise<{ result: string; action?: string }> {
  const num = (v: unknown) => (Number.isFinite(Number(v)) && Number(v) > 0 ? Number(v) : undefined);
  const day = isDate(String(input.date)) && String(input.date) <= addDays(today, 1) ? String(input.date) : today;
  const skipped: string[] = [];
  const exercises: LoggedExercise[] = (Array.isArray(input.exercises) ? input.exercises : []).flatMap((raw: Record<string, unknown>) => {
    const id = String(raw.exercise_id ?? "");
    if (!getExercise(id)) { skipped.push(id); return []; }
    const sets = (Array.isArray(raw.sets) ? raw.sets : []).slice(0, 30).map((x: Record<string, unknown>) => ({
      type: "normal" as const, reps: num(x.reps), weight: num(x.weight_lb), minutes: num(x.minutes), seconds: num(x.seconds), miles: num(x.miles), avgHR: num(x.avg_hr), done: true,
    }));
    return [{ exerciseId: id, notes: String(raw.notes ?? "").slice(0, 300), restSec: 90, superset: null, sets: sets.length ? sets : [{ type: "normal" as const, done: true }] }];
  });
  const watch = { avgHR: num(input.avg_hr), maxHR: num(input.max_hr), calories: num(input.calories), durationMin: num(input.duration_min), distanceMi: num(input.distance_mi), source: "Coach" };
  // the session's cardio numbers belong on its cardio entry too (first cardio exercise without its own numbers)
  const ci = exercises.findIndex((e) => getExercise(e.exerciseId)?.kind === "cardio");
  if (ci >= 0) {
    const s0 = exercises[ci].sets[0];
    exercises[ci].sets[0] = { ...s0, minutes: s0.minutes ?? (exercises.length === 1 ? watch.durationMin : undefined), miles: s0.miles ?? watch.distanceMi,
      avgHR: s0.avgHR ?? watch.avgHR, maxHR: s0.maxHR ?? watch.maxHR, calories: s0.calories ?? watch.calories };
  }
  const hasWatch = !!(watch.avgHR || watch.maxHR || watch.calories || watch.distanceMi);

  if (input.add_to_existing === true) {
    const latest = (await listWorkouts(user.id)).find((w) => w.date === day);
    const existing = latest ? await getWorkout(user.id, latest.id) : null;
    if (!existing) return { result: `No workout is logged on ${day} yet — log it as a new workout instead.` };
    const merged = await saveWorkout(user.id, {
      ...existing, exercises: [...existing.exercises, ...exercises],
      watch: { ...(existing.watch ?? {}), ...Object.fromEntries(Object.entries(watch).filter(([, v]) => v !== undefined)) } as Workout["watch"],
    });
    const what = [hasWatch && "heart-rate data", exercises.length && `${exercises.length} exercise${exercises.length > 1 ? "s" : ""}`].filter(Boolean).join(" and ") || "nothing new";
    return { result: `Added ${what} to "${merged.name}" (${day}).${skipped.length ? ` Unknown exercise ids skipped: ${skipped.join(", ")}.` : ""}`, action: `Added ${what} to ${merged.name}` };
  }

  if (!exercises.length && !watch.durationMin) return { result: "Nothing to log — need at least one exercise or a duration." };
  const rec = await getProgram(user.id);
  const rname = String(input.routine_name ?? "").trim().toLowerCase();
  const routine = rname ? rec?.program.routines.find((r) => r.name.toLowerCase() === rname) : undefined;
  const minutes = watch.durationMin ?? 0;
  const start = new Date(`${day}T12:00:00`);
  const w = await saveWorkout(user.id, {
    date: day, name: String(input.name ?? "").trim() || routine?.name || "Workout", routineKey: routine?.key ?? null,
    startedAt: start.toISOString(), endedAt: new Date(start.getTime() + minutes * 60000).toISOString(),
    exercises: exercises.length ? exercises : [{ exerciseId: cardioExerciseFor(String(input.name ?? "")), notes: "", restSec: 0, superset: null, sets: [cardioSet(watch)] }],
    notes: String(input.notes ?? "").slice(0, 500) || "Logged with the coach.",
    watch: hasWatch || minutes ? { ...watch, syncedAt: "" } : undefined,
  });
  const prs = w.stats.prs.map((p) => `${getExercise(p.exerciseId)?.name} ${p.label} ${p.value} ${p.unit}`);
  return {
    result: `Logged "${w.name}" on ${day}: ${w.exercises.length} exercise(s), ${w.stats.sets} sets${w.stats.volume ? `, ${w.stats.volume} lb volume` : ""}${prs.length ? `. New records: ${prs.join("; ")}` : ""}.${skipped.length ? ` Unknown exercise ids skipped: ${skipped.join(", ")}.` : ""}`,
    action: `Logged workout: ${w.name}${minutes ? ` · ${minutes} min` : ""}${watch.avgHR ? ` · avg ${watch.avgHR} bpm` : ""}`,
  };
}
