import { listUsers, requireUser, resolveTarget } from "@/lib/auth";
import { getAlerts, getCustomHabits, getHabitLog, getMealPlan, getRecipe, getCheckIn, getEvening, getProfile, getProgram, getYesterdayCheckIn, listWorkouts } from "@/lib/data";
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

  // This week's numbers for the rings
  const weekDates = weekStrip.map((x) => x.date);
  const weekWorkouts = workouts.filter((w) => weekDates.includes(w.date));
  const evenings = profile?.kind === "adult" ? await Promise.all(weekDates.filter((d) => d <= date).map((d) => getEvening(target.id, d))) : [];
  const weekStats = {
    done: new Set(weekWorkouts.map((w) => w.date)).size,
    planned: weekStrip.filter((x) => x.routine).length,
    activeMin: Math.round(weekWorkouts.reduce((a, w) => a + Math.max(0, (Date.parse(w.endedAt) - Date.parse(w.startedAt)) / 60000), 0)),
    eveningsOnPlan: evenings.filter((e) => e === "plan").length,
    eveningsLogged: evenings.filter(Boolean).length,
  };

  // For a parent: the other family members (with unseen alerts) for the switcher
  let family: { id: string; name: string; alerts: number }[] = [];
  if (me.role === "parent") {
    const [users, alerts] = await Promise.all([listUsers(), getAlerts()]);
    family = users.filter((u) => u.id !== me.id).map((u) => ({ id: u.id, name: u.name, alerts: alerts.filter((a) => a.athleteId === u.id && !a.seen).length }));
  }

  // Tonight's planned dinner (the user's own meal plan)
  let dinner: { id: string; title: string; timeMin: number; plateTip: string } | null = null;
  if (profile?.kind === "adult") {
    const plan = await getMealPlan(target.id, monday);
    const rid = plan.days[date];
    const rec = rid ? await getRecipe(rid) : null;
    if (rec) dinner = { id: rec.id, title: rec.title, timeMin: rec.timeMin, plateTip: rec.plateTip };
  }

  // Habits: program habits + the user's own, today's ticks and this week's ticks
  const custom = await getCustomHabits(target.id);
  const habitList = [...(p?.dailyHabits ?? []).map((name) => ({ name, custom: false })), ...custom.filter((c) => !(p?.dailyHabits ?? []).includes(c)).map((name) => ({ name, custom: true }))];
  const habitLogs = await Promise.all(weekDates.map((d) => (d <= date ? getHabitLog(target.id, d) : Promise.resolve([] as string[]))));
  const habitWeek = Object.fromEntries(weekDates.map((d, i) => [d, habitLogs[i]]));

  return ok({
    habitList,
    habitWeek,
    dinner,
    me: { id: me.id, name: me.name, role: me.role },
    family,
    weekStats,
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
    weekStrip,
    workoutsToday: workouts.filter((w) => w.date === date),
  });
});
