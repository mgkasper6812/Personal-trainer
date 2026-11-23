import { requireUser } from "@/lib/auth";
import { readWorkoutScreenshot } from "@/lib/coach";
import { getWorkout, listWorkouts, putWorkout } from "@/lib/data";
import { isDate } from "@/lib/dates";
import { bad, body, handle, ok } from "@/lib/http";
import type { ScreenshotWorkout } from "@/lib/schemas";
import type { Workout } from "@/lib/types";

export const maxDuration = 60;

const exerciseFor = (activity: string) => {
  const a = activity.toLowerCase();
  if (/zone ?2/.test(a)) return "zone2_cardio";
  if (/walk|hike/.test(a)) return "brisk_walk";
  if (/run|jog/.test(a)) return "run";
  if (/cycl|bike|ride|spin/.test(a)) return "easy_bike";
  return "other_cardio";
};

// action "read": screenshot → numbers (nothing saved). action "save": log a new workout or attach to an existing one.
export const POST = handle(async (req) => {
  const me = await requireUser();
  if (me instanceof Response) return me;
  const b = await body<{ action: string; image: string; today: string; workout: ScreenshotWorkout; attachTo: string | null }>(req);
  const today = isDate(b.today) ? b.today : new Date().toISOString().slice(0, 10);

  if (b.action === "read") {
    const m = typeof b.image === "string" ? b.image.match(/^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/=]+)$/) : null;
    if (!m) return bad("Attach a JPG or PNG screenshot");
    if (m[2].length > 5_000_000) return bad("That image is too large");
    const w = await readWorkoutScreenshot(m[1] as "image/jpeg" | "image/png" | "image/webp", m[2], today);
    if (!w.found) return ok({ workout: w, candidates: [] });
    const date = isDate(w.date) ? w.date : today;
    const candidates = (await listWorkouts(me.id)).filter((x) => x.date === date && !x.watch).map((x) => ({ id: x.id, name: x.name }));
    return ok({ workout: { ...w, date }, candidates });
  }

  if (b.action === "save") {
    const w = b.workout;
    if (!w || typeof w !== "object" || !isDate(w.date)) return bad("Missing workout");
    const n = (x: unknown) => (Number.isFinite(Number(x)) && Number(x) > 0 ? Math.round(Number(x) * 10) / 10 : undefined);
    const watch = { avgHR: n(w.avgHR), maxHR: n(w.maxHR), calories: n(w.activeCalories) ?? n(w.totalCalories), durationMin: n(w.durationMin), syncedAt: new Date().toISOString() };
    if (typeof b.attachTo === "string" && b.attachTo) {
      const existing = await getWorkout(me.id, b.attachTo);
      if (!existing) return bad("Workout not found", 404);
      existing.watch = watch;
      await putWorkout(me.id, existing);
      return ok({ id: existing.id, summary: `Added ${w.source} data to ${existing.name}: ${watch.durationMin ?? "?"} min, avg HR ${watch.avgHR ?? "?"}, ${watch.calories ?? "?"} kcal.` });
    }
    const minutes = n(w.durationMin) ?? 0;
    const start = /^\d{2}:\d{2}$/.test(w.startTime ?? "") ? new Date(`${w.date}T${w.startTime}:00`) : new Date(`${w.date}T12:00:00`);
    const end = new Date(start.getTime() + minutes * 60000);
    const details = [n(w.distanceMi) && `${n(w.distanceMi)} mi`, w.avgPace, n(w.elevationFt) && `${n(w.elevationFt)} ft climb`,
      w.zoneMinutes?.length ? `zones: ${w.zoneMinutes.map((z) => `Z${z.zone} ${z.minutes}m`).join(", ")}` : ""].filter(Boolean).join(" · ");
    const workout: Workout = {
      id: crypto.randomUUID(), date: w.date, name: `${w.activity || "Workout"} (${w.source})`.slice(0, 80), routineKey: null,
      startedAt: start.toISOString(), endedAt: end.toISOString(),
      exercises: [{ exerciseId: exerciseFor(w.activity ?? ""), notes: details, restSec: 0, superset: null, sets: [{ type: "normal", minutes: minutes || undefined, done: true }] }],
      notes: `Imported from a ${w.source} screenshot.`,
      watch, stats: { volume: 0, sets: 1, prs: [] },
    };
    await putWorkout(me.id, workout);
    return ok({ id: workout.id, summary: `Logged ${workout.name}: ${minutes} min${details ? `, ${details}` : ""}, avg HR ${watch.avgHR ?? "?"}, ${watch.calories ?? "?"} kcal.` });
  }
  return bad("Unknown action");
});
