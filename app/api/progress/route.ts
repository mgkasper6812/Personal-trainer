import { listUsers, requireUser, resolveTarget } from "@/lib/auth";
import { getCheckIn, getEvening, getExerciseStats, getProfile, getWeights, getWorkout, listWorkouts } from "@/lib/data";
import { addDays, isDate } from "@/lib/dates";
import { EXERCISES, getExercise } from "@/lib/exercises";
import { bad, handle, ok } from "@/lib/http";

// Everything the Progress tab shows for one person.
export const GET = handle(async (req) => {
  const me = await requireUser();
  if (me instanceof Response) return me;
  const url = new URL(req.url);
  const date = url.searchParams.get("date");
  if (!isDate(date)) return bad("Missing date");
  const target = await resolveTarget(me, url.searchParams.get("user"));
  if (!target) return bad("Not allowed", 403);

  const [profile, workouts, weights] = await Promise.all([getProfile(target.id), listWorkouts(target.id), getWeights(target.id)]);
  const athlete = profile?.kind === "athlete";

  // 4-week consistency grid, Monday-aligned, oldest first
  const dow = (new Date(`${date}T12:00:00Z`).getUTCDay() + 6) % 7;
  const first = addDays(date, -(21 + dow));
  const days = Array.from({ length: 28 }, (_, i) => addDays(first, i));
  const half = await Promise.all(days.map(async (d) => {
    if (d > date) return false;
    if (athlete) return !!(await getCheckIn(target.id, d));
    return (await getEvening(target.id, d)) === "plan";
  }));
  const cells = days.map((d, i) => ({ date: d, state: d > date ? "future" : workouts.some((w) => w.date === d) ? "workout" : half[i] ? "half" : "rest" }));

  // Recent records from the latest workouts
  const recent = await Promise.all(workouts.filter((w) => w.prs > 0).slice(0, 8).map((w) => getWorkout(target.id, w.id)));
  const records = recent.flatMap((w) => (w ? w.stats.prs.map((p) => ({ ...p, name: getExercise(p.exerciseId)?.name ?? p.exerciseId, date: w.date })) : [])).slice(0, 6);

  // Athlete: best bat speed per day across swing exercises
  let batSpeed: { date: string; mph: number }[] = [];
  if (athlete) {
    const swingIds = EXERCISES.filter((e) => e.kind === "swings").map((e) => e.id);
    const stats = await Promise.all(swingIds.map((id) => getExerciseStats(target.id, id)));
    const byDay = new Map<string, number>();
    for (const s of stats) for (const h of s.history) if (h.topSpeed) byDay.set(h.date, Math.max(byDay.get(h.date) ?? 0, h.topSpeed));
    batSpeed = [...byDay].map(([d, mph]) => ({ date: d, mph })).sort((a, b) => a.date.localeCompare(b.date));
  }

  let people: { id: string; name: string }[] = [];
  if (me.role === "parent") people = (await listUsers()).map((u) => ({ id: u.id, name: u.id === me.id ? "Me" : u.name }));

  return ok({
    user: { id: target.id, name: target.name, self: target.id === me.id },
    kind: profile?.kind ?? null,
    goal: profile?.kind === "adult" ? { start: profile.weightLb, target: profile.targetWeightLb } : null,
    people,
    weights: weights.slice(-120),
    batSpeed,
    cells,
    records,
    workouts: workouts.slice(0, 10),
  });
});
