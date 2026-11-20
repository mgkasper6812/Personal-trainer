import { requireUser, resolveTarget } from "@/lib/auth";
import { getCheckIn, getEvening, getProfile, getProgram, getYesterdayCheckIn, listWorkouts } from "@/lib/data";
import { addDays, daysBetween, isDate, mondayOf, weekdayName } from "@/lib/dates";
import { bad, handle, ok } from "@/lib/http";
import { adjustRoutine, evaluate } from "@/lib/rules";

export const GET = handle(async (req) => {
  const me = await requireUser();
  if (me instanceof Response) return me;
  const url = new URL(req.url);
  const date = url.searchParams.get("date");
  if (!isDate(date)) return bad("Missing date");
  const target = await resolveTarget(me, url.searchParams.get("user"));
  if (!target) return bad("Not allowed", 403);
  const self = target.id === me.id;

  const [profile, rec, checkIn, yesterday, evening, workouts] = await Promise.all([
    getProfile(target.id), getProgram(target.id), getCheckIn(target.id, date), getYesterdayCheckIn(target.id, date),
    getEvening(target.id, date), listWorkouts(target.id),
  ]);
  const dow = new Date(`${date}T12:00:00Z`).getUTCDay();
  const p = rec?.program;
  const notStarted = !!rec && date < rec.startDate;
  const slot = notStarted ? null : p?.schedule.find((s) => s.dayOfWeek === dow) ?? null;
  const base = slot?.routineKey ? p!.routines.find((r) => r.key === slot.routineKey) ?? null : null;
  const readiness = profile ? evaluate(profile, target.name, checkIn, yesterday, base) : null;
  const routine = base && readiness ? adjustRoutine(base, readiness) : base;
  const week = rec ? Math.floor(Math.max(0, daysBetween(rec.startDate, date)) / 7) + 1 : null;

  const monday = mondayOf(date);
  const weekStrip = Array.from({ length: 7 }, (_, i) => {
    const d = addDays(monday, i);
    const dw = new Date(`${d}T12:00:00Z`).getUTCDay();
    const s = p?.schedule.find((x) => x.dayOfWeek === dw);
    const r = s?.routineKey ? p!.routines.find((x) => x.key === s.routineKey) : null;
    return { date: d, dow: dw, routine: rec && d >= rec.startDate ? r?.name ?? null : null, done: workouts.some((w) => w.date === d) };
  });

  return ok({
    user: { id: target.id, name: target.name, role: target.role, self },
    date,
    weekday: weekdayName(date),
    hasProfile: !!profile,
    hasProgram: !!rec,
    profileKind: profile?.kind ?? null,
    program: p ? { title: p.title, week, blockWeeks: p.blockWeeks, weekInfo: p.weeks.find((w) => w.week === week) ?? null } : null,
    slotNote: notStarted ? `Program starts ${weekdayName(rec!.startDate)}, ${rec!.startDate.slice(5).replace("-", "/")}` : slot?.note ?? null,
    startDate: rec?.startDate ?? null,
    routine,
    baseRoutineKey: base?.key ?? null,
    readiness,
    // Parents see the structured check-in, not her private note.
    checkIn: checkIn ? (self ? checkIn : { ...checkIn, note: undefined }) : null,
    evening,
    tonight: profile?.kind === "adult"
      ? { tvTime: profile.tvTime, kitchenCloses: profile.kitchenCloses, swaps: profile.eveningSwaps, plan: p?.nutrition?.eveningPlan ?? null }
      : null,
    nutrition: p?.nutrition ?? null,
    fueling: p?.fueling ?? null,
    habits: p?.dailyHabits ?? [],
    weekStrip,
    workoutsToday: workouts.filter((w) => w.date === date),
  });
});
