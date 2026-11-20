import { requireUser, resolveTarget } from "@/lib/auth";
import { getExerciseStats } from "@/lib/data";
import { EXERCISE_BY_ID } from "@/lib/exercises";
import { bad, handle, ok } from "@/lib/http";

// Previous performance + history for the given exercises (feeds the logger's "Previous" column and charts).
export const GET = handle(async (req) => {
  const me = await requireUser();
  if (me instanceof Response) return me;
  const url = new URL(req.url);
  const target = await resolveTarget(me, url.searchParams.get("user"));
  if (!target) return bad("Not allowed", 403);
  const ids = (url.searchParams.get("ids") ?? "").split(",").filter((x) => EXERCISE_BY_ID.has(x)).slice(0, 40);
  const entries = await Promise.all(ids.map(async (id) => [id, await getExerciseStats(target.id, id)] as const));
  return ok({ stats: Object.fromEntries(entries) });
});
