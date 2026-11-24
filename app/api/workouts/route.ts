import { requireUser, resolveTarget } from "@/lib/auth";
import { listWorkouts } from "@/lib/data";
import { isDate } from "@/lib/dates";
import { bad, body, handle, ok } from "@/lib/http";
import type { Workout } from "@/lib/types";
import { saveWorkout } from "@/lib/workout-save";

export const GET = handle(async (req) => {
  const me = await requireUser();
  if (me instanceof Response) return me;
  const target = await resolveTarget(me, new URL(req.url).searchParams.get("user"));
  if (!target) return bad("Not allowed", 403);
  return ok({ name: target.name, workouts: await listWorkouts(target.id) });
});

// Save a finished workout (with optional heart-rate data read from a screenshot).
export const POST = handle(async (req) => {
  const me = await requireUser();
  if (me instanceof Response) return me;
  const b = await body<Workout>(req);
  if (!isDate(b.date) || !Array.isArray(b.exercises)) return bad("Bad workout");
  return ok({ workout: await saveWorkout(me.id, b as Workout) });
});
