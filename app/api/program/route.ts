import { requireUser, resolveTarget } from "@/lib/auth";
import { getProfile, getProgram } from "@/lib/data";
import { bad, handle, ok } from "@/lib/http";

export const GET = handle(async (req) => {
  const me = await requireUser();
  if (me instanceof Response) return me;
  const target = await resolveTarget(me, new URL(req.url).searchParams.get("user"));
  if (!target) return bad("Not allowed", 403);
  const [rec, profile] = await Promise.all([getProgram(target.id), getProfile(target.id)]);
  return ok({ name: target.name, role: target.role, record: rec, profile });
});
