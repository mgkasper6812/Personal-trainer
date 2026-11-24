import { requireUser } from "@/lib/auth";
import { isDate } from "@/lib/dates";
import { bad, handle, ok } from "@/lib/http";
import { getReview, yesterdayOf } from "@/lib/review";

export const maxDuration = 60;

// The coach's report on the day before `date` (the user's own; written on first request, then cached).
export const GET = handle(async (req) => {
  const me = await requireUser();
  if (me instanceof Response) return me;
  const date = new URL(req.url).searchParams.get("date");
  if (!isDate(date)) return bad("Missing date");
  return ok({ review: await getReview(me, yesterdayOf(date)) });
});
