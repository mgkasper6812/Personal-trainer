import { requireUser, resolveTarget } from "@/lib/auth";
import { deleteWorkout, getWorkout, putWorkout } from "@/lib/data";
import { cleanWatch, saveWorkout } from "@/lib/workout-save";
import { withCardio } from "@/lib/cardio";
import { getExercise } from "@/lib/exercises";
import { bad, ok } from "@/lib/http";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(req: Request, { params }: Ctx) {
  const me = await requireUser();
  if (me instanceof Response) return me;
  const target = await resolveTarget(me, new URL(req.url).searchParams.get("user"));
  if (!target) return bad("Not allowed", 403);
  const w = await getWorkout(target.id, (await params).id);
  return w ? ok({ workout: w, self: target.id === me.id }) : bad("Not found", 404);
}

export async function DELETE(_req: Request, { params }: Ctx) {
  const me = await requireUser();
  if (me instanceof Response) return me;
  await deleteWorkout(me.id, (await params).id);
  return ok({ ok: true });
}

// Set or clear a workout's heart-rate data (read from screenshots on the summary screen).
export async function PATCH(req: Request, { params }: Ctx) {
  const me = await requireUser();
  if (me instanceof Response) return me;
  const w = await getWorkout(me.id, (await params).id);
  if (!w) return bad("Not found", 404);
  const b = (await req.json().catch(() => ({}))) as { watch?: unknown; startedAt?: string; endedAt?: string };
  // Edit time: when it started and when it ended
  if (typeof b.startedAt === "string" && typeof b.endedAt === "string") {
    const s = Date.parse(b.startedAt), e = Date.parse(b.endedAt);
    if (isNaN(s) || isNaN(e) || e <= s || e - s > 12 * 3600000) return bad("Check the start time and length");
    w.startedAt = new Date(s).toISOString(); w.endedAt = new Date(e).toISOString();
    if (w.watch?.durationMin) w.watch = { ...w.watch, durationMin: Math.round((e - s) / 60000) };
    await putWorkout(me.id, w);
    return ok({ workout: w });
  }
  if (b.watch === null) { w.watch = undefined; await putWorkout(me.id, w); return ok({ workout: w }); }
  const watch = cleanWatch(b.watch) ?? w.watch;
  // log the full cardio numbers on the workout's cardio entry too, then re-save so stats and records update
  const saved = await saveWorkout(me.id, { ...w, watch, exercises: withCardio(w.exercises, watch, (id) => getExercise(id)?.kind) });
  return ok({ workout: saved });
}
