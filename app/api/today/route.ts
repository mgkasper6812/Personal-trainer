import { requireUser, resolveTarget } from "@/lib/auth";
import { blockWeek, getCheckIn, getPlan, getProgram } from "@/lib/data";
import { isDate, weekdayName } from "@/lib/dates";
import { bad, handle, ok } from "@/lib/http";

export const GET = handle(async (req) => {
  const me = await requireUser();
  if (me instanceof Response) return me;
  const url = new URL(req.url);
  const date = url.searchParams.get("date");
  if (!isDate(date)) return bad("Missing date");
  const target = await resolveTarget(me, url.searchParams.get("user"));
  if (!target) return bad("Not allowed", 403);
  const [rec, checkIn, plan] = await Promise.all([getProgram(target.id), getCheckIn(target.id, date), getPlan(target.id, date)]);
  const week = rec ? blockWeek(rec, date) : null;
  const dow = new Date(`${date}T12:00:00Z`).getUTCDay();
  return ok({
    user: { id: target.id, name: target.name, role: target.role, self: target.id === me.id },
    me: { id: me.id, role: me.role, name: me.name },
    date,
    weekday: weekdayName(date),
    hasProgram: !!rec,
    program: rec
      ? {
          title: rec.program.title,
          blockWeeks: rec.program.blockWeeks,
          week,
          weekInfo: rec.program.weeks.find((w) => w.week === week) ?? null,
          template: rec.program.weeklyTemplate.find((d) => d.dayOfWeek === dow) ?? null,
        }
      : null,
    checkIn,
    plan,
  });
});
