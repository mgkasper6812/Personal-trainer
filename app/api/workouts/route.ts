import { requireUser, resolveTarget } from "@/lib/auth";
import { getExerciseStats, listWorkouts, putWorkout, saveExerciseStats } from "@/lib/data";
import { isDate } from "@/lib/dates";
import { EXERCISE_BY_ID } from "@/lib/exercises";
import { bad, body, handle, ok } from "@/lib/http";
import { findPRs, summarize, workoutVolume } from "@/lib/stats";
import type { LoggedExercise, LoggedSet, PR, SetType, Workout } from "@/lib/types";

export const GET = handle(async (req) => {
  const me = await requireUser();
  if (me instanceof Response) return me;
  const target = await resolveTarget(me, new URL(req.url).searchParams.get("user"));
  if (!target) return bad("Not allowed", 403);
  return ok({ name: target.name, workouts: await listWorkouts(target.id) });
});

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
    rpe: n(s.rpe, 10), done: s.done === true,
  };
}

// Save a finished workout: compute volume and personal records, update per-exercise history.
export const POST = handle(async (req) => {
  const me = await requireUser();
  if (me instanceof Response) return me;
  const b = await body<Workout>(req);
  if (!isDate(b.date) || !Array.isArray(b.exercises)) return bad("Bad workout");
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
  const startedAt = typeof b.startedAt === "string" ? b.startedAt : new Date().toISOString();
  const endedAt = typeof b.endedAt === "string" ? b.endedAt : new Date().toISOString();

  const prs: PR[] = [];
  for (const ex of exercises) {
    const point = summarize(ex, b.date, id);
    if (!point) continue;
    const stats = await getExerciseStats(me.id, ex.exerciseId);
    const history = stats.history.filter((h) => h.workoutId !== id);
    prs.push(...findPRs(point, history, ex.exerciseId));
    await saveExerciseStats(me.id, ex.exerciseId, {
      last: { date: b.date, sets: ex.sets.filter((s) => s.done) },
      history: [...history, point].sort((a, c) => a.date.localeCompare(c.date)).slice(-300),
    });
  }
  const workout: Workout = {
    id,
    date: b.date,
    name: typeof b.name === "string" ? b.name.slice(0, 80) : "Workout",
    routineKey: typeof b.routineKey === "string" ? b.routineKey : null,
    startedAt,
    endedAt,
    exercises,
    rpe: n(b.rpe, 10),
    notes: typeof b.notes === "string" ? b.notes.slice(0, 1000) : undefined,
    stats: { ...workoutVolume({ exercises }), prs },
  };
  await putWorkout(me.id, workout);
  return ok({ workout });
});
