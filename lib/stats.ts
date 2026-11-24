import { getExercise } from "./exercises";
import type { LoggedExercise, LoggedSet, PR, Workout } from "./types";

export const e1rm = (w: number, reps: number) => (reps <= 1 ? w : w * (1 + reps / 30));
const working = (sets: LoggedSet[]) => sets.filter((s) => s.done && s.type !== "warmup");

/** Per-exercise numbers for one session — used for history charts and PRs. */
export type ExercisePoint = {
  date: string;
  workoutId: string;
  miles?: number;
  avgHR?: number;
  e1rm?: number;
  topWeight?: number;
  volume?: number;
  reps?: number;
  seconds?: number;
  minutes?: number;
  topSpeed?: number;
  topEV?: number;
  best?: number; // sprint best (lowest seconds) or jump/throw best distance
  swings?: number;
};

export function summarize(ex: LoggedExercise, date: string, workoutId: string): ExercisePoint | null {
  const e = getExercise(ex.exerciseId);
  const sets = working(ex.sets);
  if (!e || !sets.length) return null;
  const p: ExercisePoint = { date, workoutId };
  const max = (xs: (number | undefined)[]) => {
    const v = xs.filter((x): x is number => typeof x === "number" && x > 0);
    return v.length ? Math.max(...v) : undefined;
  };
  switch (e.kind) {
    case "weight_reps":
      p.e1rm = max(sets.map((s) => (s.weight && s.reps ? Math.round(e1rm(s.weight, s.reps)) : undefined)));
      p.topWeight = max(sets.map((s) => s.weight));
      p.volume = sets.reduce((a, s) => a + (s.weight ?? 0) * (s.reps ?? 0), 0);
      break;
    case "reps":
      p.reps = max(sets.map((s) => s.reps));
      p.volume = sets.reduce((a, s) => a + (s.weight ?? 0) * (s.reps ?? 0), 0);
      break;
    case "duration":
      p.seconds = max(sets.map((s) => s.seconds));
      break;
    case "cardio":
      p.minutes = sets.reduce((a, s) => a + (s.minutes ?? 0), 0);
      p.miles = sets.reduce((a, s) => a + (s.miles ?? 0), 0) || undefined;
      p.avgHR = max(sets.map((s) => s.avgHR));
      break;
    case "swings":
      p.topSpeed = max(sets.map((s) => s.topSpeed));
      p.topEV = max(sets.map((s) => s.topEV));
      p.swings = sets.reduce((a, s) => a + (s.count ?? 0), 0);
      break;
    case "throws":
      p.topSpeed = max(sets.map((s) => s.topSpeed));
      p.best = max(sets.map((s) => s.distance));
      break;
    case "jump":
      p.best = max(sets.map((s) => s.distance));
      break;
    case "sprint": {
      const t = sets.map((s) => s.seconds).filter((x): x is number => !!x && x > 0);
      p.best = t.length ? Math.min(...t) : undefined;
      break;
    }
  }
  return p;
}

/** Which numbers count as records for an exercise kind (higher is better unless noted). */
const RECORD_FIELDS: Record<string, { field: keyof ExercisePoint; label: string; unit: string; lower?: boolean }[]> = {
  weight_reps: [
    { field: "e1rm", label: "Est. 1RM", unit: "lb" },
    { field: "topWeight", label: "Heaviest", unit: "lb" },
  ],
  reps: [{ field: "reps", label: "Most reps", unit: "reps" }],
  duration: [{ field: "seconds", label: "Longest", unit: "s" }],
  swings: [
    { field: "topSpeed", label: "Top bat speed", unit: "mph" },
    { field: "topEV", label: "Top exit velo", unit: "mph" },
  ],
  throws: [
    { field: "topSpeed", label: "Top throw velo", unit: "mph" },
    { field: "best", label: "Longest throw", unit: "ft" },
  ],
  jump: [{ field: "best", label: "Best jump", unit: "in" }],
  sprint: [{ field: "best", label: "Fastest", unit: "s", lower: true }],
  cardio: [],
};

export function findPRs(point: ExercisePoint, history: ExercisePoint[], exerciseId: string): PR[] {
  const e = getExercise(exerciseId);
  if (!e || !history.length) return []; // first time isn't a "record"
  const out: PR[] = [];
  for (const f of RECORD_FIELDS[e.kind] ?? []) {
    const v = point[f.field] as number | undefined;
    if (v == null) continue;
    const prev = history.map((h) => h[f.field] as number | undefined).filter((x): x is number => x != null);
    if (!prev.length) continue;
    const beat = f.lower ? v < Math.min(...prev) : v > Math.max(...prev);
    if (beat) out.push({ exerciseId, label: f.label, value: v, unit: f.unit });
  }
  return out;
}

export function workoutVolume(w: Pick<Workout, "exercises">) {
  let volume = 0;
  let sets = 0;
  for (const ex of w.exercises)
    for (const s of working(ex.sets)) {
      sets++;
      volume += (s.weight ?? 0) * (s.reps ?? 0);
    }
  return { volume, sets };
}
