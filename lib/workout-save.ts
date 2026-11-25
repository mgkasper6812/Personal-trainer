import { getExerciseStats, putWorkout, saveExerciseStats } from "./data";
import { EXERCISE_BY_ID } from "./exercises";
import { findPRs, summarize, workoutVolume } from "./stats";
import type { LoggedExercise, LoggedSet, PR, SetType, Workout } from "./types";

const n = (v: unknown, max: number) => {
  const x = Number(v);
  return v == null || v === "" || !Number.isFinite(x) || x < 0 ? undefined : Math.min(max, Math.round(x * 100) / 100);
};
const TYPES: SetType[] = ["warmup", "normal", "drop", "failure"];

function cleanSet(s: Partial<LoggedSet>): LoggedSet {
  return {
    type: TYPES.includes(s.type as SetType) ? (s.type as SetType) : "normal",
    weight: n(s.weight, 2000), reps: n(s.reps, 1000), seconds: n(s.seconds, 36000), count: n(s.count, 1000),
    topSpeed: n(s.topSpeed, 150), topEV: n(s.topEV, 150), distance: n(s.distance, 2000), minutes: n(s.minutes, 600),
    miles: n(s.miles, 500), avgHR: n(s.avgHR, 250), maxHR: n(s.maxHR, 250), calories: n(s.calories, 5000),
    rpe: n(s.rpe, 10), done: s.done === true,
  };
}

type Watch = NonNullable<Workout["watch"]>;
export function cleanWatch(w: unknown): Watch | undefined {
  if (!w || typeof w !== "object") return undefined;
  const x = w as Record<string, unknown>;
  const out: Watch = {
    avgHR: n(x.avgHR, 250), maxHR: n(x.maxHR, 250), calories: n(x.calories, 5000), durationMin: n(x.durationMin, 600), distanceMi: n(x.distanceMi, 200),
    zones: typeof x.zones === "string" && x.zones ? x.zones.slice(0, 120) : undefined,
    source: typeof x.source === "string" && x.source ? x.source.slice(0, 30) : undefined,
    activity: typeof x.activity === "string" && x.activity ? x.activity.slice(0, 60) : undefined,
    pace: typeof x.pace === "string" && x.pace ? x.pace.slice(0, 20) : undefined,
    elevationFt: n(x.elevationFt, 30000),
    syncedAt: new Date().toISOString(),
  };
  return out.avgHR || out.maxHR || out.calories || out.durationMin || out.distanceMi ? out : undefined;
}

/** Save a finished workout: compute volume and personal records, update per-exercise history. */
export async function saveWorkout(uid: string, b: Partial<Workout> & { date: string; exercises: LoggedExercise[] }): Promise<Workout> {
  const exercises: LoggedExercise[] = b.exercises
    .filter((e) => EXERCISE_BY_ID.has(e?.exerciseId))
    .slice(0, 40)
    .map((e) => ({
      exerciseId: e.exerciseId,
      notes: typeof e.notes === "string" ? e.notes.slice(0, 500) : "",
      restSec: n(e.restSec, 900) ?? 90,
      superset: typeof e.superset === "string" ? e.superset.slice(0, 3) : null,
      sets: (Array.isArray(e.sets) ? e.sets : []).slice(0, 30).map(cleanSet),
    }));
  const id = typeof b.id === "string" && /^[\w-]{6,64}$/.test(b.id) ? b.id : crypto.randomUUID();
  const endedAt = typeof b.endedAt === "string" && !isNaN(Date.parse(b.endedAt)) ? b.endedAt : new Date().toISOString();
  let startedAt = typeof b.startedAt === "string" && !isNaN(Date.parse(b.startedAt)) ? b.startedAt : endedAt;
  // Logged after the fact (45 seconds of tapping) but the Watch/screenshot says 40 minutes: trust the Watch.
  const watchMin = cleanWatch(b.watch)?.durationMin;
  if (watchMin && Date.parse(endedAt) - Date.parse(startedAt) < watchMin * 60000 * 0.5) startedAt = new Date(Date.parse(endedAt) - watchMin * 60000).toISOString();
  const prs: PR[] = [];
  for (const ex of exercises) {
    const point = summarize(ex, b.date, id);
    if (!point) continue;
    const stats = await getExerciseStats(uid, ex.exerciseId);
    const history = stats.history.filter((h) => h.workoutId !== id);
    prs.push(...findPRs(point, history, ex.exerciseId));
    await saveExerciseStats(uid, ex.exerciseId, {
      last: { date: b.date, sets: ex.sets.filter((s) => s.done) },
      history: [...history, point].sort((a, c) => a.date.localeCompare(c.date)).slice(-300),
    });
  }
  const workout: Workout = {
    id, date: b.date,
    name: typeof b.name === "string" && b.name.trim() ? b.name.slice(0, 80) : "Workout",
    routineKey: typeof b.routineKey === "string" ? b.routineKey : null,
    startedAt, endedAt, exercises,
    rpe: n(b.rpe, 10),
    notes: typeof b.notes === "string" ? b.notes.slice(0, 1000) : undefined,
    watch: cleanWatch(b.watch),
    stats: { ...workoutVolume({ exercises }), prs },
  };
  await putWorkout(uid, workout);
  return workout;
}
