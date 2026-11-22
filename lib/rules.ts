import { getExercise, type Region } from "./exercises";
import type { Routine } from "./schemas";
import type { CheckIn, Profile } from "./types";

// Deterministic readiness + pain rules. These never get weakened by the AI.

export type Readiness = {
  status: "green" | "yellow" | "red";
  reasons: string[];
  removed: { exerciseId: string; why: string }[];
  dropOneSet: boolean;
  recoveryOnly: boolean;
  alert: { level: "warn" | "urgent"; message: string } | null;
  urgent: string | null; // shown to the user prominently
  avoid: Region[]; // body areas to keep out of today's session
};

const ARM: Region[] = ["shoulder", "elbow", "wrist"];
const RED_FLAGS = ["dark urine", "swelling with weakness", "numbness or tingling", "pain at rest or at night"];
export const ATHLETE_RED_FLAGS = RED_FLAGS;
export const ADULT_SYMPTOMS = ["chest pain or pressure", "dizziness or fainting", "unusual shortness of breath", "very thirsty / blurry vision"];

export function evaluate(
  profile: Profile,
  name: string,
  c: CheckIn | null,
  yesterday: CheckIn | null,
  routine: Routine | null,
): Readiness {
  const r: Readiness = { status: "green", reasons: [], removed: [], dropOneSet: false, recoveryOnly: false, alert: null, urgent: null, avoid: [] };
  if (!c) return r;
  const athlete = profile.kind === "athlete";

  // ---- Adult warning symptoms
  if (!athlete && c.symptoms?.length) {
    r.status = "red";
    r.recoveryOnly = true;
    r.urgent = `You reported ${c.symptoms.join(", ")}. Don't exercise today — call your doctor. If it's chest pain or fainting, call 911.`;
    r.reasons.push("Warning symptoms reported");
  }

  // ---- Pain (separate from soreness)
  if (c.pain && c.painRegion) {
    const region = c.painRegion;
    const level = c.painLevel ?? 0;
    const arm = athlete && (ARM.includes(region) || c.painWithThrowing);
    const regions = new Set<Region>([region]);
    if (arm) ARM.forEach((x) => regions.add(x));
    r.avoid = [...regions];
    for (const ex of routine?.exercises ?? []) {
      const e = getExercise(ex.exerciseId);
      if (!e) continue;
      const hits = e.regions.some((x) => regions.has(x)) || (arm && (e.tags.includes("throwing") || e.tags.includes("overhead")));
      if (hits) r.removed.push({ exerciseId: e.id, why: `loads your ${region}` });
    }
    r.status = level >= 7 || c.painQuality === "sharp" ? "red" : "yellow";
    r.reasons.push(`Pain: ${region}${c.painSide ? ` (${c.painSide})` : ""} ${level}/10${c.painQuality ? `, ${c.painQuality}` : ""}`);
    if (athlete) {
      const repeat = yesterday?.pain && yesterday.painRegion === region;
      const parts = [
        `${name} reported ${region} pain ${level}/10${c.painQuality ? ` (${c.painQuality})` : ""}${c.painWithThrowing ? " when throwing" : ""}.`,
        arm ? "Throwing and overhead work removed today." : `Exercises that load the ${region} removed today.`,
      ];
      if (repeat) parts.push("This is the second day in a row — consider an athletic trainer or doctor check.");
      if (level >= 7 || c.painQuality === "sharp") parts.push("Sharp or severe pain — she should get it checked before training it again.");
      r.alert = { level: level >= 7 || repeat || c.painQuality === "sharp" ? "urgent" : "warn", message: parts.join(" ") };
    }
  }
  if (athlete && c.redFlags?.length) {
    r.status = "red";
    r.recoveryOnly = true;
    r.urgent = `You reported ${c.redFlags.join(", ")}. No training today — tell your dad and get seen by a doctor today.`;
    r.alert = { level: "urgent", message: `${name} reported ${c.redFlags.join(", ")}. These need a doctor today. Training is off.` };
  }

  // ---- Readiness (sleep, energy, soreness)
  const low = [
    (c.sleepHours ?? 8) < (athlete ? 7 : 6) && `short sleep (${c.sleepHours}h)`,
    (c.energy ?? 3) <= 2 && "low energy",
    (c.soreness ?? 1) >= 4 && "very sore",
    athlete && (c.stress ?? 1) >= 4 && "high stress",
  ].filter(Boolean) as string[];
  if (low.length) {
    r.reasons.push(...low);
    if (low.length >= 2 && !r.recoveryOnly) {
      r.status = "red";
      r.recoveryOnly = true;
    } else if (r.status === "green") {
      r.status = "yellow";
      r.dropOneSet = true;
    } else {
      r.dropOneSet = true;
    }
  }
  // A red day, or a session with nothing safe left in it, becomes a recovery session.
  const total = routine?.exercises.length ?? 0;
  if (r.status === "red" || (total > 0 && r.removed.length >= total)) {
    r.status = "red";
    r.recoveryOnly = true;
  }
  return r;
}

/** Apply readiness to a routine for today's session. */
export function adjustRoutine(routine: Routine, r: Readiness): Routine {
  if (r.recoveryOnly) {
    return {
      ...routine,
      key: `${routine.key}-recovery`,
      name: "Recovery",
      purpose: "Recovery day — move easy, feel better tomorrow.",
      estMinutes: 25,
      exercises: [
        { exerciseId: "easy_bike", sets: 1, warmupSets: 0, repsMin: null, repsMax: null, seconds: null, minutes: 12, count: null, weightLb: null, targetRpe: null, tempo: null, restSec: 0, superset: null, notes: "Conversational pace" },
        { exerciseId: "mobility_flow", sets: 1, warmupSets: 0, repsMin: null, repsMax: null, seconds: 600, minutes: null, count: null, weightLb: null, targetRpe: null, tempo: null, restSec: 0, superset: null, notes: "Skip anything that hurts" },
      ].filter((e) => !getExercise(e.exerciseId)?.regions.some((x) => r.avoid.includes(x))),
    };
  }
  const removed = new Set(r.removed.map((x) => x.exerciseId));
  return {
    ...routine,
    exercises: routine.exercises
      .filter((e) => !removed.has(e.exerciseId))
      .map((e) => (r.dropOneSet && e.sets > 1 ? { ...e, sets: e.sets - 1 } : e)),
  };
}
