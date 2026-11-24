import type { LoggedSet, Workout } from "./types";

export type Watch = NonNullable<Workout["watch"]>;

/** Which exercise a cardio activity is ("Outdoor Walk" → brisk_walk). */
export function cardioExerciseFor(activity: string) {
  const a = activity.toLowerCase();
  if (/zone ?2/.test(a)) return "zone2_cardio";
  if (/walk|hike/.test(a)) return "brisk_walk";
  if (/run|jog/.test(a)) return "run";
  if (/cycl|bike|ride|spin/.test(a)) return "easy_bike";
  return "other_cardio";
}

/** Strength-type activities carry heart-rate data but aren't a cardio entry. */
export const isStrengthActivity = (activity?: string) => !!activity && /strength|functional|hiit|core|yoga|pilates|cross ?training/i.test(activity);

/** One cardio set holding everything the screenshot showed. */
export function cardioSet(w: Partial<Watch>, prev?: Partial<LoggedSet>): LoggedSet {
  return {
    type: "normal", done: true,
    minutes: w.durationMin ?? prev?.minutes, miles: w.distanceMi ?? prev?.miles,
    avgHR: w.avgHR ?? prev?.avgHR, maxHR: w.maxHR ?? prev?.maxHR, calories: w.calories ?? prev?.calories,
  };
}

/** The details that don't have their own column, for the exercise notes. */
export function cardioNotes(w: Partial<Watch>) {
  return [w.pace, w.elevationFt && `${w.elevationFt} ft climb`, w.zones && `Zones ${w.zones}`, w.source && `from ${w.source}`].filter(Boolean).join(" · ");
}

/** Put a screenshot's cardio numbers on a saved workout's cardio entry (or add one). Strength screenshots leave exercises alone. */
export function withCardio(exercises: Workout["exercises"], w: Watch | undefined, getKind: (id: string) => string | undefined): Workout["exercises"] {
  if (!w || isStrengthActivity(w.activity) || !(w.durationMin || w.distanceMi)) return exercises;
  const notes = cardioNotes(w);
  const i = exercises.findIndex((e) => getKind(e.exerciseId) === "cardio");
  if (i < 0) return [...exercises, { exerciseId: cardioExerciseFor(w.activity ?? ""), notes, restSec: 0, superset: null, sets: [cardioSet(w)] }];
  return exercises.map((e, j) => (j === i ? {
    ...e, notes: e.notes.includes(notes) ? e.notes : [e.notes, notes].filter(Boolean).join(" · "),
    sets: [cardioSet(w, e.sets[0]), ...e.sets.slice(1)],
  } : e));
}
