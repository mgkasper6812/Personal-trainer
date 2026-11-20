import { listUsers, publicUser, requireUser } from "@/lib/auth";
import { usageThisMonth } from "@/lib/coach";
import { getAlerts, getCheckIn, getProfile, getProgram, getYesterdayCheckIn, listWorkouts, markAlertsSeen } from "@/lib/data";
import { evaluate } from "@/lib/rules";
import { isDate } from "@/lib/dates";
import { bad, handle, ok } from "@/lib/http";

export const GET = handle(async (req) => {
  const me = await requireUser();
  if (me instanceof Response) return me;
  if (me.role !== "parent") return bad("Parents only", 403);
  const date = new URL(req.url).searchParams.get("date");
  const users = await listUsers();
  const members = await Promise.all(
    users.map(async (u) => {
      const [rec, profile, workouts, checkIn, yesterday] = await Promise.all([
        getProgram(u.id), getProfile(u.id), listWorkouts(u.id),
        isDate(date) ? getCheckIn(u.id, date) : null, isDate(date) ? getYesterdayCheckIn(u.id, date) : null,
      ]);
      const status = profile && checkIn ? evaluate(profile, u.name, checkIn, yesterday, null).status : null;
      const since = isDate(date) ? new Date(Date.parse(`${date}T12:00:00Z`) - 6 * 86400000).toISOString().slice(0, 10) : "";
      return {
        ...publicUser(u),
        hasProfile: !!profile,
        hasProgram: !!rec,
        programTitle: rec?.program.title ?? null,
        status,
        checkedIn: !!checkIn,
        workoutsThisWeek: workouts.filter((w) => w.date >= since).length,
        recent: workouts.slice(0, 3),
      };
    }),
  );
  return ok({ me: publicUser(me), members, alerts: await getAlerts(), usage: await usageThisMonth() });
});

export const POST = handle(async () => {
  const me = await requireUser();
  if (me instanceof Response) return me;
  if (me.role !== "parent") return bad("Parents only", 403);
  await markAlertsSeen();
  return ok({ ok: true });
});
