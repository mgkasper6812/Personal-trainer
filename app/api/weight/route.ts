import { requireUser } from "@/lib/auth";
import { addWeight, getWeights } from "@/lib/data";
import { isDate } from "@/lib/dates";
import { bad, body, handle, ok } from "@/lib/http";

export const POST = handle(async (req) => {
  const me = await requireUser();
  if (me instanceof Response) return me;
  if (me.role !== "parent") return bad("Not available", 403);
  const b = await body<{ date: string; lb: number }>(req);
  const lb = Math.round(Number(b.lb) * 10) / 10;
  if (!isDate(b.date) || !Number.isFinite(lb) || lb < 50 || lb > 600) return bad("Enter a weight between 50 and 600 lb");
  await addWeight(me.id, b.date, lb);
  const w = await getWeights(me.id);
  return ok({ lb, last: w.slice(-2) });
});
