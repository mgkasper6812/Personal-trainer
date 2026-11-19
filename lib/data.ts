import { db } from "./db";
import { addDays, daysBetween } from "./dates";
import type { DailyPlan, Profile, Program } from "./schemas";
import type { Alert, CheckIn } from "./types";
import type { OnboardingState } from "./coach";

export type ProgramRecord = { program: Program; startDate: string; createdAt: string };
export type PlanRecord = { plan: DailyPlan; generatedAt: string; checkInAt: string | null; done: string[] };

export const getOnboarding = (uid: string) => db().get<OnboardingState>(`onboarding:${uid}`);
export const saveOnboarding = (uid: string, s: OnboardingState) => db().set(`onboarding:${uid}`, s);

export const getProfile = (uid: string) => db().get<Profile>(`profile:${uid}`);
export const saveProfile = (uid: string, p: Profile) => db().set(`profile:${uid}`, p);

export const getProgram = (uid: string) => db().get<ProgramRecord>(`program:${uid}`);
export const saveProgram = (uid: string, r: ProgramRecord) => db().set(`program:${uid}`, r);

export const getCheckIn = (uid: string, date: string) => db().get<CheckIn>(`checkin:${uid}:${date}`);
export const saveCheckIn = (uid: string, c: CheckIn) => db().set(`checkin:${uid}:${c.date}`, c);

export const getPlan = (uid: string, date: string) => db().get<PlanRecord>(`plan:${uid}:${date}`);
export const savePlan = (uid: string, date: string, r: PlanRecord) => db().set(`plan:${uid}:${date}`, r);

export function blockWeek(rec: ProgramRecord, date: string) {
  const d = daysBetween(rec.startDate, date);
  return d < 0 ? 1 : Math.floor(d / 7) + 1;
}

export async function recentHistory(uid: string, date: string, days = 7) {
  const dates = Array.from({ length: days }, (_, i) => addDays(date, -(i + 1)));
  return Promise.all(
    dates.map(async (d) => {
      const [checkIn, plan] = await Promise.all([getCheckIn(uid, d), getPlan(uid, d)]);
      const total = plan ? plan.plan.sections.reduce((a, s) => a + s.items.length, 0) : 0;
      return { date: d, checkIn, completed: plan ? `${plan.done.length}/${total} items` : "no plan" };
    }),
  );
}

export const getAlerts = async () => (await db().get<Alert[]>("family:alerts")) ?? [];
export async function addAlert(a: Omit<Alert, "id" | "createdAt" | "seen">) {
  const alerts = await getAlerts();
  alerts.unshift({ ...a, id: crypto.randomUUID(), createdAt: new Date().toISOString(), seen: false });
  await db().set("family:alerts", alerts.slice(0, 100));
}
export async function markAlertsSeen() {
  const alerts = await getAlerts();
  await db().set("family:alerts", alerts.map((a) => ({ ...a, seen: true })));
}
