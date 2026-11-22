"use client";
import { getExercise, type ExerciseKind } from "./exercises";
import type { Routine, RoutineExercise } from "./schemas";
import type { ExerciseStats } from "./data";
import type { LoggedExercise, LoggedSet } from "./types";

// The in-progress workout lives in localStorage so it survives the app closing, a phone lock or a lost connection.

export type Target = { repsMin: number | null; repsMax: number | null; seconds: number | null; minutes: number | null; count: number | null;
  weightLb?: number | null; targetRpe?: number | null; tempo?: string | null; notes?: string | null };
export type ActiveExercise = LoggedExercise & { target?: Target; hint?: string };
export type ActiveWorkout = {
  id: string;
  date: string;
  name: string;
  routineKey: string | null;
  startedAt: string;
  exercises: ActiveExercise[];
  restEndsAt: number | null;
  restTotal: number;
  notes: string;
};

const KEY = "ft-active-workout";
export function loadActive(): ActiveWorkout | null {
  try { const s = localStorage.getItem(KEY); return s ? (JSON.parse(s) as ActiveWorkout) : null; } catch { return null; }
}
export function saveActive(w: ActiveWorkout | null) {
  try { w ? localStorage.setItem(KEY, JSON.stringify(w)) : localStorage.removeItem(KEY); } catch {}
}

export const columns = (kind: ExerciseKind): { key: keyof LoggedSet; label: string; step?: number }[] => {
  switch (kind) {
    case "weight_reps": return [{ key: "weight", label: "LB", step: 2.5 }, { key: "reps", label: "REPS" }];
    case "reps": return [{ key: "reps", label: "REPS" }];
    case "duration": return [{ key: "seconds", label: "SEC" }];
    case "cardio": return [{ key: "minutes", label: "MIN" }];
    case "swings": return [{ key: "count", label: "SWINGS" }, { key: "topSpeed", label: "BAT MPH" }, { key: "topEV", label: "EV MPH" }];
    case "throws": return [{ key: "count", label: "THROWS" }, { key: "topSpeed", label: "MPH" }];
    case "sprint": return [{ key: "seconds", label: "SEC" }];
    case "jump": return [{ key: "distance", label: "IN" }];
  }
};

export function formatSet(kind: ExerciseKind, s: Partial<LoggedSet>) {
  switch (kind) {
    case "weight_reps": return s.weight != null && s.reps != null ? `${s.weight} × ${s.reps}` : "";
    case "reps": return s.reps != null ? `${s.reps} reps` : "";
    case "duration": return s.seconds != null ? `${s.seconds}s` : "";
    case "cardio": return s.minutes != null ? `${s.minutes} min` : "";
    case "swings": return [s.count && `${s.count} sw`, s.topSpeed && `${s.topSpeed} mph`, s.topEV && `EV ${s.topEV}`].filter(Boolean).join(" · ");
    case "throws": return [s.count && `${s.count}`, s.topSpeed && `${s.topSpeed} mph`].filter(Boolean).join(" · ");
    case "sprint": return s.seconds != null ? `${s.seconds}s` : "";
    case "jump": return s.distance != null ? `${s.distance}"` : "";
  }
}

/** Expand a routine into loggable sets, pre-filled from last time (Hevy-style), with a progression hint. */
export function fromRoutine(routine: Routine, date: string, stats: Record<string, ExerciseStats>, deload: boolean): ActiveWorkout {
  return {
    id: crypto.randomUUID(),
    date,
    name: routine.name,
    routineKey: routine.key,
    startedAt: new Date().toISOString(),
    exercises: routine.exercises.map((r) => buildExercise(r, stats[r.exerciseId], deload)),
    restEndsAt: null,
    restTotal: 0,
    notes: "",
  };
}

export function buildExercise(r: RoutineExercise, st: ExerciseStats | undefined, deload = false): ActiveExercise {
  const e = getExercise(r.exerciseId)!;
  const last = st?.last?.sets.filter((s) => s.type !== "warmup") ?? [];
  const target: Target = { repsMin: r.repsMin, repsMax: r.repsMax, seconds: r.seconds, minutes: r.minutes, count: r.count,
    weightLb: r.weightLb, targetRpe: r.targetRpe ?? null, tempo: r.tempo ?? null, notes: r.notes };
  let weight = last.length ? Math.max(...last.map((s) => s.weight ?? 0)) || undefined : r.weightLb ?? undefined;
  let hint: string | undefined;
  if (e.kind === "weight_reps" && last.length && r.repsMax && weight) {
    const allTop = last.every((s) => (s.reps ?? 0) >= r.repsMax!);
    if (allTop && !deload) { weight += 5; hint = `You hit ${r.repsMax} reps on every set last time — +5 lb today.`; }
  }
  if (deload && weight) { weight = Math.round((weight * 0.85) / 2.5) * 2.5; hint = "Lighter week: ~85% of your usual weight."; }
  const base = (): LoggedSet => ({
    type: "normal", done: false,
    weight: e.kind === "weight_reps" ? weight : undefined,
    seconds: r.seconds ?? undefined, minutes: r.minutes ?? undefined, count: r.count ?? undefined,
  });
  const warm: LoggedSet[] = Array.from({ length: r.warmupSets }, () => ({ ...base(), type: "warmup", weight: weight ? Math.round((weight * 0.5) / 5) * 5 : undefined }));
  return {
    exerciseId: r.exerciseId,
    notes: r.notes ?? "",
    restSec: r.restSec || 90,
    superset: r.superset,
    sets: [...warm, ...Array.from({ length: Math.max(1, r.sets) }, base)],
    target,
    hint,
  };
}

export function targetLabel(kind: ExerciseKind, t?: Target) {
  if (!t) return "";
  if (kind === "weight_reps" || kind === "reps" || kind === "jump")
    return t.repsMin ? (t.repsMax && t.repsMax !== t.repsMin ? `${t.repsMin}–${t.repsMax} reps` : `${t.repsMin} reps`) : "";
  if (kind === "duration") return t.seconds ? `${t.seconds}s` : "";
  if (kind === "cardio") return t.minutes ? `${t.minutes} min` : "";
  if (kind === "swings" || kind === "throws") return t.count ? `${t.count} per set` : "";
  return "";
}

export const fmtClock = (sec: number) => {
  const s = Math.max(0, Math.round(sec));
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), ss = s % 60;
  return h ? `${h}:${String(m).padStart(2, "0")}:${String(ss).padStart(2, "0")}` : `${m}:${String(ss).padStart(2, "0")}`;
};

/** Start a workout from a routine (or an empty one) and open the logger. */
export async function startWorkout(routine: Routine | null, date: string, deload = false) {
  const active = loadActive();
  if (active && !confirm(`You have "${active.name}" in progress. Discard it and start a new workout?`)) {
    window.location.href = "/workout";
    return;
  }
  let stats: Record<string, ExerciseStats> = {};
  if (routine?.exercises.length) {
    try {
      const res = await fetch(`/api/exercises/stats?ids=${routine.exercises.map((e) => e.exerciseId).join(",")}`);
      if (res.ok) stats = (await res.json()).stats;
    } catch {}
  }
  const w: ActiveWorkout = routine
    ? fromRoutine(routine, date, stats, deload)
    : { id: crypto.randomUUID(), date, name: "Workout", routineKey: null, startedAt: new Date().toISOString(), exercises: [], restEndsAt: null, restTotal: 0, notes: "" };
  saveActive(w);
  window.location.href = "/workout";
}
