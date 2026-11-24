import { requireUser, resolveTarget } from "@/lib/auth";
import { deleteWorkout, getWorkout, putWorkout } from "@/lib/data";
import { cleanWatch } from "@/lib/workout-save";
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
  const b = (await req.json().catch(() => ({}))) as { watch?: unknown };
  w.watch = b.watch === null ? undefined : cleanWatch(b.watch) ?? w.watch;
  await putWorkout(me.id, w);
  return ok({ workout: w });
}
