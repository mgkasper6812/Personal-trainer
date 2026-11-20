import { requireUser, resolveTarget } from "@/lib/auth";
import { cleanProgram, generateProgram } from "@/lib/coach";
import { getProfile, getProgram, saveProgram } from "@/lib/data";
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
  const program = await generateProgram(me.role, me.name, profile, startDate);
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

// Change the start date without rebuilding the program.
export const PATCH = handle(async (req) => {
  const me = await requireUser();
  if (me instanceof Response) return me;
  const { startDate } = await body<{ startDate: string }>(req);
  if (!isDate(startDate)) return bad("Pick a valid date");
  const rec = await getProgram(me.id);
  if (!rec) return bad("No program yet", 404);
  rec.startDate = startDate;
  await saveProgram(me.id, rec);
  return ok({ record: rec });
});
