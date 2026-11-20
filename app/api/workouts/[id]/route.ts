import { requireUser, resolveTarget } from "@/lib/auth";
import { deleteWorkout, getWorkout } from "@/lib/data";
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
