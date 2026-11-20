import { requireUser } from "@/lib/auth";
import { addAlert, addWeight, getProfile, getProgram, getYesterdayCheckIn, saveCheckIn } from "@/lib/data";
import { isDate } from "@/lib/dates";
import type { Region } from "@/lib/exercises";
import { bad, body, handle, ok } from "@/lib/http";
import { evaluate } from "@/lib/rules";
import type { CheckIn } from "@/lib/types";

const REGIONS: Region[] = ["shoulder", "elbow", "wrist", "back", "hip", "knee", "ankle", "neck"];
const num = (v: unknown, min: number, max: number) => {
  const n = Number(v);
  return v === "" || v == null || !Number.isFinite(n) ? undefined : Math.min(max, Math.max(min, n));
};
const strs = (v: unknown) => (Array.isArray(v) ? v.filter((x) => typeof x === "string").map((x) => x.slice(0, 60)).slice(0, 8) : undefined);

export const POST = handle(async (req) => {
  const me = await requireUser();
  if (me instanceof Response) return me;
  const b = await body(req);
  if (!isDate(b.date)) return bad("Missing date");
  const athlete = me.role === "athlete";
  const c: CheckIn = {
    date: b.date,
    sleepHours: num(b.sleepHours, 0, 16),
    energy: num(b.energy, 1, 5),
    soreness: num(b.soreness, 1, 5),
    mood: athlete ? num(b.mood, 1, 5) : undefined,
    stress: athlete ? num(b.stress, 1, 5) : undefined,
    pain: b.pain === true,
    painRegion: REGIONS.includes(b.painRegion as Region) ? (b.painRegion as Region) : undefined,
    painSide: ["left", "right", "both"].includes(b.painSide as string) ? (b.painSide as CheckIn["painSide"]) : undefined,
    painLevel: num(b.painLevel, 0, 10),
    painQuality: b.painQuality === "sharp" || b.painQuality === "achy" ? b.painQuality : undefined,
    painWithThrowing: athlete ? b.painWithThrowing === true : undefined,
    redFlags: athlete ? strs(b.redFlags) : undefined,
    symptoms: athlete ? undefined : strs(b.symptoms),
    note: typeof b.note === "string" ? b.note.slice(0, 500) : undefined,
  };
  await saveCheckIn(me.id, c);
  const weight = athlete ? undefined : num(b.weightLb, 50, 600);
  if (weight) await addWeight(me.id, c.date, weight);

  const [profile, rec, yesterday] = await Promise.all([getProfile(me.id), getProgram(me.id), getYesterdayCheckIn(me.id, c.date)]);
  if (profile && athlete) {
    const dow = new Date(`${c.date}T12:00:00Z`).getUTCDay();
    const key = rec?.program.schedule.find((s) => s.dayOfWeek === dow)?.routineKey;
    const routine = rec?.program.routines.find((r) => r.key === key) ?? null;
    const r = evaluate(profile, me.name, c, yesterday, routine);
    if (r.alert) await addAlert({ athleteId: me.id, athleteName: me.name, date: c.date, level: r.alert.level, message: r.alert.message });
  }
  return ok({ checkIn: c });
});
