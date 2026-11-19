import { listUsers, publicUser, requireUser } from "@/lib/auth";
import { usageThisMonth } from "@/lib/coach";
import { getAlerts, getPlan, getProgram, markAlertsSeen } from "@/lib/data";
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
      const [rec, plan] = await Promise.all([getProgram(u.id), isDate(date) ? getPlan(u.id, date) : null]);
      const total = plan ? plan.plan.sections.reduce((a, s) => a + s.items.length, 0) : 0;
      return {
        ...publicUser(u),
        hasProgram: !!rec,
        programTitle: rec?.program.title ?? null,
        today: plan ? { done: plan.done.length, total, readiness: plan.plan.readiness, headline: plan.plan.headline } : null,
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
