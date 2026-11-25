import { ask, mockMode } from "./coach";
import { postCoachMessage } from "./chat";
import { walkedOn, getCheckIn, getFoodLog, getHabitLog, getProfile, getProgram, getWorkout, listWorkouts } from "./data";
import { db } from "./db";
import { weekdayName } from "./dates";
import { getExercise } from "./exercises";
import { coachSystem } from "./prompts";
import { CoachNote } from "./schemas";
import type { User } from "./types";

const NOTE_RULES = `
Write a short proactive message as their coach — like a text from a real trainer. Look at the data, pick the ONE thing that matters most
right now, and give a specific, practical suggestion (what to eat next and roughly when, how to fit the workout in, what to adjust).
Be direct if they're behind; praise real progress. 2–4 short sentences. Use only the data given. Offer 2–3 short replies they might tap.`;
const ATHLETE_NOTE = ` This is a teen athlete: never mention food amounts, calories or weight; fueling advice is about performance only.`;

/** Midday check-in: how today is going so far, and one suggestion for the rest of it. */
export async function middayNote(user: User, date: string, localTime: string) {
  const key = `nudge:${user.id}:midday:${date}`;
  if (await db().get(key)) return null;
  const [profile, rec, food, checkIn, habits, workouts] = await Promise.all([
    getProfile(user.id), getProgram(user.id), getFoodLog(user.id, date), getCheckIn(user.id, date), getHabitLog(user.id, date), listWorkouts(user.id),
  ]);
  if (!rec) return null;
  const athlete = profile?.kind === "athlete";
  const dow = new Date(`${date}T12:00:00Z`).getUTCDay();
  const slot = date >= rec.startDate ? rec.program.schedule.find((s) => s.dayOfWeek === dow) : null;
  const routine = slot?.routineKey ? rec.program.routines.find((r) => r.key === slot.routineKey) : null;
  const data: Record<string, unknown> = {
    now: `${weekdayName(date)} ${localTime}`,
    todaysSession: routine ? `${routine.name} (~${routine.estMinutes} min)` : slot?.note ?? "rest",
    workoutDone: workouts.some((w) => w.date === date),
    checkIn: checkIn ? { sleep: checkIn.sleepHours, energy: checkIn.energy, soreness: checkIn.soreness, pain: checkIn.pain } : "not done",
  };
  if (!athlete) data.walkedAfterDinner = walkedOn(habits);
  if (!athlete) {
    const n = rec.program.nutrition;
    data.foodSoFar = { calories: food.reduce((a, e) => a + (e.calories ?? 0), 0), protein: food.reduce((a, e) => a + e.grams, 0), meals: [...new Set(food.map((e) => e.meal))], targets: { calories: n?.calories, protein: n?.proteinG } };
  }
  const note = mockMode()
    ? { message: athlete ? "Session's on the board today — get it in before practice and eat a real snack first." : "You're 90 g short on protein at lunch. Tuna or a shake this afternoon and a big serving of chicken tonight closes it.", replies: ["Plan my afternoon", "What's for dinner?"] }
    : (await ask(CoachNote, { system: `${coachSystem(user.role)}\n${NOTE_RULES}${athlete ? ATHLETE_NOTE : ""}`, messages: [{ role: "user", content: `Midday check-in for ${user.name}.\n${JSON.stringify(data)}` }], effort: "low", maxTokens: 2000 })).data;
  await db().set(key, true);
  await postCoachMessage(user.id, note.message, "nudge", note.replies);
  return note;
}

/** Feedback on a finished workout, posted to the chat once. */
export async function workoutFeedback(user: User, workoutId: string) {
  const key = `nudge:${user.id}:workout:${workoutId}`;
  const cached = await db().get<{ message: string; replies: string[] }>(key);
  if (cached) return cached;
  const [w, profile, rec] = await Promise.all([getWorkout(user.id, workoutId), getProfile(user.id), getProgram(user.id)]);
  if (!w) return null;
  const routine = w.routineKey ? rec?.program.routines.find((r) => r.key === w.routineKey) : null;
  const data = {
    workout: w.name,
    minutes: Math.round((Date.parse(w.endedAt) - Date.parse(w.startedAt)) / 60000),
    exercises: w.exercises.map((e) => {
      const plan = routine?.exercises.find((x) => x.exerciseId === e.exerciseId);
      return { name: getExercise(e.exerciseId)?.name, plan: plan ? { sets: plan.sets, reps: [plan.repsMin, plan.repsMax], weightLb: plan.weightLb, rpe: plan.targetRpe } : null,
        done: e.sets.map((s) => ({ weight: s.weight, reps: s.reps, seconds: s.seconds, count: s.count, topSpeed: s.topSpeed, rpe: s.rpe })), notes: e.notes || undefined };
    }),
    records: w.stats.prs.map((p) => `${getExercise(p.exerciseId)?.name}: ${p.label} ${p.value} ${p.unit}`),
    watch: w.watch ?? null,
  };
  const athlete = profile?.kind === "athlete";
  const note = mockMode()
    ? { message: `Solid ${w.name}. ${w.stats.prs.length ? "New records — that's real progress. " : ""}You hit the top of the rep range on your first lift; add 5 lb next time.`, replies: ["What should I eat now?", "Plan my next session"] }
    : (await ask(CoachNote, { system: `${coachSystem(user.role)}\n${NOTE_RULES}${athlete ? ATHLETE_NOTE : ""}\nThis message is feedback on the workout they just finished: compare to the plan, call out records, and say exactly what to change next time (weight, reps, rest).`,
        messages: [{ role: "user", content: JSON.stringify(data) }], effort: "low", maxTokens: 2000 })).data;
  await db().set(key, note);
  await postCoachMessage(user.id, `${w.name}: ${note.message}`, "workout", note.replies);
  return note;
}
