import { requireUser, resolveTarget } from "@/lib/auth";
import { cleanProgram, generateProgram } from "@/lib/coach";
import { getHealthBio, getProfile, getProgram, saveProgram } from "@/lib/data";
import { isDate, mondayOf } from "@/lib/dates";
import { EXERCISE_BY_ID } from "@/lib/exercises";
import { bad, body, handle, ok } from "@/lib/http";
import type { Routine } from "@/lib/schemas";

export const maxDuration = 300;

export const GET = handle(async (req) => {
  const me = await requireUser();
  if (me instanceof Response) return me;
  const target = await resolveTarget(me, new URL(req.url).searchParams.get("user"));
  if (!target) return bad("Not allowed", 403);
  return ok({ name: target.name, role: target.role, self: target.id === me.id, record: await getProgram(target.id) });
});

// Generate (or regenerate) the signed-in user's program from their profile.
export const POST = handle(async (req) => {
  const me = await requireUser();
  if (me instanceof Response) return me;
  const b = await body<{ date: string; startDate: string }>(req);
  const profile = await getProfile(me.id);
  if (!profile) return bad("Finish setup first.", 409);
  const date = isDate(b.date) ? b.date : new Date().toISOString().slice(0, 10);
  // Start on the chosen day, or this week's Monday by default.
  const startDate = isDate(b.startDate) ? b.startDate : mondayOf(date);
  const bio = me.role === "parent" ? await getHealthBio(me.id) : null;
  const program = await generateProgram(me.role, me.name, profile, startDate, bio);
  const record = { program, startDate, createdAt: new Date().toISOString() };
  await saveProgram(me.id, record);
  return ok({ record });
});

// Save an edited routine (Hevy-style routine editor).
export const PUT = handle(async (req) => {
  const me = await requireUser();
  if (me instanceof Response) return me;
  const { routine } = await body<{ routine: Routine }>(req);
  const rec = await getProgram(me.id);
  if (!rec || !routine?.key) return bad("Nothing to update");
  const i = rec.program.routines.findIndex((r) => r.key === routine.key);
  if (i < 0) return bad("Unknown routine", 404);
  routine.exercises = (routine.exercises ?? []).filter((e) => EXERCISE_BY_ID.has(e.exerciseId)).slice(0, 30);
  rec.program.routines[i] = { ...rec.program.routines[i], ...routine, name: String(routine.name).slice(0, 60) };
  rec.program = cleanProgram(rec.program);
  await saveProgram(me.id, rec);
  return ok({ record: rec });
});

const TEMPLATES: Record<string, Omit<Routine, "key">> = {
  zone2: {
    name: "Zone 2 Cardio",
    purpose: "Easy, steady cardio — improves insulin sensitivity and heart health.",
    estMinutes: 40,
    exercises: [{ exerciseId: "zone2_cardio", sets: 1, warmupSets: 0, repsMin: null, repsMax: null, seconds: null, minutes: 40, count: null, weightLb: null, targetRpe: null, tempo: null, restSec: 0, superset: null, notes: "Conversational pace. Watch: stay in Zone 2." }],
  },
  blank: { name: "New routine", purpose: "Your own routine.", estMinutes: 30, exercises: [] },
};

// Change the start date, the weekly schedule, or add a routine — without rebuilding the program.
export const PATCH = handle(async (req) => {
  const me = await requireUser();
  if (me instanceof Response) return me;
  const b = await body<{ startDate: string; day: number; routineKey: string | null; note: string | null; newRoutine: { template: string; name?: string; day?: number } }>(req);
  const rec = await getProgram(me.id);
  if (!rec) return bad("No program yet", 404);
  if (b.startDate !== undefined) {
    if (!isDate(b.startDate)) return bad("Pick a valid date");
    rec.startDate = b.startDate;
  }
  let created: string | null = null;
  if (b.newRoutine && TEMPLATES[b.newRoutine.template]) {
    const t = TEMPLATES[b.newRoutine.template];
    const base = (b.newRoutine.name || t.name).trim().slice(0, 60) || t.name;
    let key = base.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "routine";
    while (rec.program.routines.some((r) => r.key === key)) key += "-2";
    rec.program.routines.push({ ...t, key, name: base, exercises: t.exercises.map((e) => ({ ...e })) });
    created = key;
    if (typeof b.newRoutine.day === "number") { b.day = b.newRoutine.day; b.routineKey = key; }
  }
  if (typeof b.day === "number" && b.day >= 0 && b.day <= 6) {
    const key = b.routineKey && rec.program.routines.some((r) => r.key === b.routineKey) ? b.routineKey : null;
    const note = typeof b.note === "string" ? b.note.slice(0, 60) : null;
    rec.program.schedule = rec.program.schedule.map((s) => (s.dayOfWeek === b.day ? { ...s, routineKey: key, note: key ? null : note ?? "Rest" } : s));
  }
  await saveProgram(me.id, rec);
  return ok({ record: rec, created });
});
