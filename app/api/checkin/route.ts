import { requireUser } from "@/lib/auth";
import { addAlert, saveCheckIn } from "@/lib/data";
import { isDate } from "@/lib/dates";
import { bad, body, handle, ok } from "@/lib/http";
import type { CheckIn } from "@/lib/types";

const num = (v: unknown, min: number, max: number) => {
  const n = Number(v);
  return v === "" || v == null || !Number.isFinite(n) ? undefined : Math.min(max, Math.max(min, n));
};
const str = (v: unknown, max = 500) => (typeof v === "string" && v.trim() ? v.trim().slice(0, max) : undefined);

export const POST = handle(async (req) => {
  const me = await requireUser();
  if (me instanceof Response) return me;
  const b = await body(req);
  if (!isDate(b.date)) return bad("Missing date");
  const c: CheckIn = {
    date: b.date,
    sleepHours: num(b.sleepHours, 0, 16),
    energy: num(b.energy, 1, 5),
    soreness: num(b.soreness, 1, 5),
    weightLb: me.role === "athlete" ? undefined : num(b.weightLb, 50, 600),
    armFeel: me.role === "athlete" ? num(b.armFeel, 1, 5) : undefined,
    pain: b.pain === true,
    painWhere: str(b.painWhere, 200),
    schedule: str(b.schedule),
    notes: str(b.notes),
  };
  await saveCheckIn(me.id, c);
  if (me.role === "athlete" && c.pain) {
    await addAlert({
      athleteId: me.id,
      athleteName: me.name,
      date: c.date,
      message: `${me.name} reported pain${c.painWhere ? ` (${c.painWhere})` : ""}. Today's plan removes anything that loads it.`,
    });
  }
  return ok({ checkIn: c });
});
