import { requireUser } from "@/lib/auth";
import { generateDailyPlan } from "@/lib/coach";
import { blockWeek, getCheckIn, getProfile, getProgram, recentHistory, savePlan } from "@/lib/data";
import { isDate, weekdayName } from "@/lib/dates";
import { bad, body, handle, ok } from "@/lib/http";

export const maxDuration = 300;

// Builds (or rebuilds) the signed-in user's plan for a date.
export const POST = handle(async (req) => {
  const me = await requireUser();
  if (me instanceof Response) return me;
  const b = await body<{ date: string }>(req);
  if (!isDate(b.date)) return bad("Missing date");
  const date = b.date;
  const [rec, profile, checkIn] = await Promise.all([
    getProgram(me.id), getProfile(me.id), getCheckIn(me.id, date),
  ]);
  if (!rec || !profile) return bad("Finish setup first.", 409);
  const plan = await generateDailyPlan({
    role: me.role,
    date,
    weekday: weekdayName(date),
    blockWeek: blockWeek(rec, date),
    profile,
    program: rec.program,
    checkIn,
    recent: await recentHistory(me.id, date),
  });
  const record = {
    plan,
    generatedAt: new Date().toISOString(),
    checkInAt: checkIn ? new Date().toISOString() : null,
    done: [], // a rebuilt plan starts fresh
  };
  await savePlan(me.id, date, record);
  return ok({ plan: record });
});
