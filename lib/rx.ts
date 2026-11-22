import { getExercise } from "./exercises";
import type { RoutineExercise } from "./schemas";

const clock = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

/** A routine exercise as a trainer would write it: sets × reps, load, effort, tempo, rest. */
export function rxParts(e: RoutineExercise): { label: string; weight?: boolean }[] {
  const ex = getExercise(e.exerciseId);
  const out: { label: string; weight?: boolean }[] = [];
  const reps = e.repsMin ? (e.repsMax && e.repsMax !== e.repsMin ? `${e.repsMin}–${e.repsMax}` : `${e.repsMin}`) : null;
  if (ex?.kind === "cardio") out.push({ label: `${e.minutes ?? 30} min` });
  else if (e.seconds) out.push({ label: `${e.sets} × ${e.seconds}s` });
  else if (e.count) out.push({ label: `${e.sets} × ${e.count} ${ex?.kind === "throws" ? "throws" : "swings"}` });
  else if (reps) out.push({ label: `${e.sets} × ${reps}` });
  else out.push({ label: `${e.sets} sets` });
  if (e.warmupSets) out.push({ label: `+${e.warmupSets} warm-up` });
  if (e.weightLb) out.push({ label: `${e.weightLb} lb${ex?.equipment.includes("dumbbell") && !ex.equipment.includes("barbell") ? " each" : ""}`, weight: true });
  if (e.targetRpe) out.push({ label: `RPE ${e.targetRpe}` });
  if (e.tempo) out.push({ label: `Tempo ${e.tempo}` });
  if (e.restSec) out.push({ label: `Rest ${clock(e.restSec)}` });
  return out;
}
