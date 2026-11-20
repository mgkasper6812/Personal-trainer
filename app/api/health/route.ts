import { addWeight, getWorkout, listWorkouts, putWorkout, userForHealthToken } from "@/lib/data";
import { isDate } from "@/lib/dates";
import { bad, body, handle, ok } from "@/lib/http";

// Called by the iPhone Shortcut. Auth is the per-user sync token (no login cookie in Shortcuts).
// Body: { token, kind: "workout", workoutId?, avgHR?, maxHR?, calories?, durationMin? }
//    or { token, kind: "weight", date, lb }
const num = (v: unknown) => {
  const x = typeof v === "string" ? Number(v.replace(/[^\d.]/g, "")) : Number(v);
  return Number.isFinite(x) && x > 0 ? Math.round(x * 10) / 10 : undefined;
};

export const POST = handle(async (req) => {
  const b = await body<Record<string, unknown>>(req);
  const uid = typeof b.token === "string" ? await userForHealthToken(b.token) : null;
  if (!uid) return bad("Invalid sync token", 401);

  if (b.kind === "weight") {
    const lb = num(b.lb);
    const date = isDate(b.date) ? b.date : new Date().toISOString().slice(0, 10);
    if (!lb || lb < 50 || lb > 600) return bad("Bad weight");
    await addWeight(uid, date, lb);
    return ok({ ok: true });
  }

  // Workout metrics: attach to the given workout, or the most recent one.
  const id = typeof b.workoutId === "string" && b.workoutId ? b.workoutId : (await listWorkouts(uid))[0]?.id;
  const w = id ? await getWorkout(uid, id) : null;
  if (!w) return bad("No workout to attach to", 404);
  w.watch = {
    avgHR: num(b.avgHR),
    maxHR: num(b.maxHR),
    calories: num(b.calories),
    durationMin: num(b.durationMin) ?? Math.round((Date.parse(w.endedAt) - Date.parse(w.startedAt)) / 60000),
    syncedAt: new Date().toISOString(),
  };
  await putWorkout(uid, w);
  return ok({ ok: true, workout: w.name, watch: w.watch });
});
