import { requireUser } from "@/lib/auth";
import { getPlan, savePlan } from "@/lib/data";
import { isDate } from "@/lib/dates";
import { bad, body, handle, ok } from "@/lib/http";

export const POST = handle(async (req) => {
  const me = await requireUser();
  if (me instanceof Response) return me;
  const b = await body<{ date: string; key: string; done: boolean }>(req);
  if (!isDate(b.date) || typeof b.key !== "string" || !/^\d+\.\d+$/.test(b.key)) return bad("Bad request");
  const rec = await getPlan(me.id, b.date);
  if (!rec) return bad("No plan for that day", 404);
  const set = new Set(rec.done);
  if (b.done) set.add(b.key);
  else set.delete(b.key);
  rec.done = [...set];
  await savePlan(me.id, b.date, rec);
  return ok({ done: rec.done });
});
