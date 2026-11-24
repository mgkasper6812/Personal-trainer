import { ask, mockMode } from "./coach";
import {
  getCheckIn, getEvening, getFoodLog, getHabitLog, getCustomHabits, getProfile, getProgram, getWeights, listWorkouts,
} from "./data";
import { db } from "./db";
import { addDays, mondayOf, weekdayName } from "./dates";
import { coachSystem } from "./prompts";
import { DailyReview } from "./schemas";
import type { User } from "./types";

export type StoredReview = DailyReview & { forDate: string; createdAt: string; empty: boolean };

const REVIEW_RULES = `
You are writing the morning report on the user's previous day. Grade it honestly.
- Be direct. When they were off track, say so plainly — name the miss, the number, and why it matters for their goal. No sugar-coating,
  no excuses for them, no lectures. Never insult or shame.
- Always end on a concrete plan for today and one genuinely encouraging line. Streaks of good days deserve real praise.
- Use only the data provided. If little or nothing was logged, say that is itself the problem ("can't coach what you don't log").
- Keep every line short and specific (numbers, foods, exercises). Max 3 items per list.`;

const ATHLETE_RULES = `
For this athlete: judge training done vs planned, sleep, recovery, check-ins, habits and any pain reports. Never mention food amounts,
calories, weight or body size; fueling advice must be about performance only. If pain was reported, make "get it checked / follow the
pain plan" today's first focus.`;

/** Everything logged for one day, plus a little week context. */
async function gather(user: User, day: string) {
  const [profile, rec, food, evening, checkIn, habitLog, custom, workouts, weights] = await Promise.all([
    getProfile(user.id), getProgram(user.id), getFoodLog(user.id, day), getEvening(user.id, day), getCheckIn(user.id, day),
    getHabitLog(user.id, day), getCustomHabits(user.id), listWorkouts(user.id), getWeights(user.id),
  ]);
  const p = rec?.program;
  const dow = new Date(`${day}T12:00:00Z`).getUTCDay();
  const slot = rec && day >= rec.startDate ? p?.schedule.find((s) => s.dayOfWeek === dow) : null;
  const planned = slot?.routineKey ? p!.routines.find((r) => r.key === slot.routineKey)?.name ?? null : null;
  const done = workouts.filter((w) => w.date === day).map((w) => `${w.name} (${w.sets} sets${w.prs ? `, ${w.prs} PR` : ""})`);
  const habits = [...(p?.dailyHabits ?? []), ...custom];
  const monday = mondayOf(day);
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(monday, i)).filter((d) => d <= day);
  const athlete = profile?.kind === "athlete";
  const sum = (k: "grams" | "calories" | "carbsG" | "fiberG") => food.reduce((a, e) => a + (Number(e[k]) || 0), 0);
  const data: Record<string, unknown> = {
    day: `${weekdayName(day)} ${day}`,
    workout: { planned: planned ?? (slot?.note ? `rest/busy (${slot.note})` : "rest"), done },
    checkIn: checkIn ? { sleepHours: checkIn.sleepHours, energy: checkIn.energy, soreness: checkIn.soreness, pain: checkIn.pain ? `${checkIn.painRegion} ${checkIn.painLevel}/10` : "none" } : "not done",
    habits: { done: habitLog, missed: habits.filter((h) => !habitLog.includes(h)) },
    weekSoFar: { workoutDays: new Set(workouts.filter((w) => weekDays.includes(w.date)).map((w) => w.date)).size, plannedDays: weekDays.filter((d) => { const s = p?.schedule.find((x) => x.dayOfWeek === new Date(`${d}T12:00:00Z`).getUTCDay()); return !!s?.routineKey; }).length },
  };
  if (!athlete) {
    const t = p?.nutrition;
    const w7 = weights.filter((w) => w.date <= day).slice(-14);
    data.food = food.length
      ? { mealsLogged: [...new Set(food.map((e) => e.meal ?? "snack"))], calories: sum("calories"), protein: sum("grams"), carbs: sum("carbsG"), fiber: sum("fiberG"),
          targets: { calories: t?.calories ?? null, protein: t?.proteinG ?? null, fiber: 30 } }
      : "nothing logged";
    data.evening = evening === "plan" ? "on plan" : evening === "bit" ? "snacked a bit" : evening === "off" ? "off plan" : "not logged";
    data.weight = { yesterday: weights.find((w) => w.date === day)?.lb ?? "not logged", recent: w7.map((w) => `${w.date.slice(5)} ${w.lb}`) };
  }
  const logged = !!(food.length || checkIn || done.length || habitLog.length || evening || weights.some((w) => w.date === day));
  return { data, athlete, logged };
}

/** The report on `day`, written once and cached. */
export async function getReview(user: User, day: string): Promise<StoredReview | null> {
  const key = `review:${user.id}:${day}`;
  const cached = await db().get<StoredReview>(key);
  if (cached) return cached;
  const rec = await getProgram(user.id);
  if (!rec || day < rec.startDate) return null; // nothing to grade before the program starts
  const { data, athlete, logged } = await gather(user, day);
  let review: DailyReview;
  if (mockMode()) {
    review = logged
      ? { grade: "C", headline: "Mixed day: protein came up short and the evening slipped.", wins: ["Checked in and logged breakfast."], misses: ["Protein 70 g under target."], todayFocus: ["Protein at every meal.", "Walk after dinner."], closer: "One good day starts now." }
      : { grade: "F", headline: "Nothing logged yesterday — I can't coach what I can't see.", wins: [], misses: ["No food, workout or check-in logged."], todayFocus: ["Check in this morning.", "Log every meal today."], closer: "Reset today. It only takes a few taps." };
  } else {
    review = (await ask(DailyReview, {
      system: `${coachSystem(user.role)}\n${REVIEW_RULES}${athlete ? ATHLETE_RULES : ""}`,
      messages: [{ role: "user", content: `Report on ${user.name}'s day.\n${JSON.stringify(data)}` }],
      effort: "low",
      maxTokens: 4000,
    })).data;
  }
  const stored: StoredReview = { ...review, forDate: day, createdAt: new Date().toISOString(), empty: !logged };
  await db().set(key, stored);
  return stored;
}

export const yesterdayOf = (today: string) => addDays(today, -1);
