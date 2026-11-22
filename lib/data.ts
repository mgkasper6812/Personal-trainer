import { db } from "./db";
import { addDays } from "./dates";
import type { Program } from "./schemas";
import type { ExercisePoint } from "./stats";
import type { Alert, CheckIn, EveningLog, HealthBio, MealPlan, Profile, Recipe, RecipeSummary, Workout, WorkoutSummary } from "./types";

export type ProgramRecord = { program: Program; startDate: string; createdAt: string };
export type ExerciseStats = { last: { date: string; sets: Workout["exercises"][number]["sets"] } | null; history: ExercisePoint[] };

// Profiles saved before the tap-first setup have no `kind`; treat them as missing so setup runs again.
export const getProfile = async (uid: string) => {
  const p = await db().get<Profile>(`profile:${uid}`);
  return p && (p as { kind?: string }).kind ? p : null;
};
export const saveProfile = (uid: string, p: Profile) => db().set(`profile:${uid}`, p);

export const getProgram = (uid: string) => db().get<ProgramRecord>(`program2:${uid}`);
export const saveProgram = (uid: string, r: ProgramRecord) => db().set(`program2:${uid}`, r);

export const getCheckIn = (uid: string, date: string) => db().get<CheckIn>(`checkin2:${uid}:${date}`);
export const saveCheckIn = (uid: string, c: CheckIn) => db().set(`checkin2:${uid}:${c.date}`, c);
export const getYesterdayCheckIn = (uid: string, date: string) => getCheckIn(uid, addDays(date, -1));

export const getEvening = (uid: string, date: string) => db().get<EveningLog>(`evening:${uid}:${date}`);
export const saveEvening = (uid: string, date: string, v: EveningLog) => db().set(`evening:${uid}:${date}`, v);

// ---- Workouts
export const getWorkout = (uid: string, id: string) => db().get<Workout>(`workout:${uid}:${id}`);
export const listWorkouts = async (uid: string) => (await db().get<WorkoutSummary[]>(`workouts:${uid}`)) ?? [];
export async function putWorkout(uid: string, w: Workout) {
  await db().set(`workout:${uid}:${w.id}`, w);
  const list = (await listWorkouts(uid)).filter((x) => x.id !== w.id);
  list.unshift({
    id: w.id, date: w.date, name: w.name, startedAt: w.startedAt, endedAt: w.endedAt,
    volume: w.stats.volume, sets: w.stats.sets, prs: w.stats.prs.length, watch: !!w.watch,
  });
  list.sort((a, b) => b.startedAt.localeCompare(a.startedAt));
  await db().set(`workouts:${uid}`, list);
}
export async function deleteWorkout(uid: string, id: string) {
  await db().del(`workout:${uid}:${id}`);
  await db().set(`workouts:${uid}`, (await listWorkouts(uid)).filter((x) => x.id !== id));
}

export const getExerciseStats = async (uid: string, exId: string) =>
  (await db().get<ExerciseStats>(`exstats:${uid}:${exId}`)) ?? { last: null, history: [] };
export const saveExerciseStats = (uid: string, exId: string, s: ExerciseStats) => db().set(`exstats:${uid}:${exId}`, s);

// ---- Alerts (family-wide)
export const getAlerts = async () => (await db().get<Alert[]>("family:alerts")) ?? [];
export async function addAlert(a: Omit<Alert, "id" | "createdAt" | "seen">) {
  const alerts = (await getAlerts()).filter((x) => !(x.athleteId === a.athleteId && x.date === a.date)); // one per athlete per day
  alerts.unshift({ ...a, id: crypto.randomUUID(), createdAt: new Date().toISOString(), seen: false });
  await db().set("family:alerts", alerts.slice(0, 100));
}
export async function markAlertsSeen() {
  await db().set("family:alerts", (await getAlerts()).map((a) => ({ ...a, seen: true })));
}

// ---- Apple Health sync token
export const getHealthToken = (uid: string) => db().get<string>(`healthtoken-of:${uid}`);
export async function newHealthToken(uid: string) {
  const old = await getHealthToken(uid);
  if (old) await db().del(`healthtoken:${old}`);
  const token = crypto.randomUUID().replace(/-/g, "");
  await db().set(`healthtoken:${token}`, uid);
  await db().set(`healthtoken-of:${uid}`, token);
  return token;
}
export const userForHealthToken = (token: string) => db().get<string>(`healthtoken:${token}`);

// ---- Weight log (from check-ins or Apple Health)
export const getWeights = async (uid: string) => (await db().get<{ date: string; lb: number }[]>(`weights:${uid}`)) ?? [];
export async function addWeight(uid: string, date: string, lb: number) {
  const list = (await getWeights(uid)).filter((x) => x.date !== date);
  list.push({ date, lb });
  list.sort((a, b) => a.date.localeCompare(b.date));
  await db().set(`weights:${uid}`, list.slice(-730));
}

// ---- Health bio (owner only — never served for another user)
export const getHealthBio = (uid: string) => db().get<HealthBio>(`health:${uid}`);
export const saveHealthBio = (uid: string, h: HealthBio) => db().set(`health:${uid}`, h);

// ---- Recipe library (family-wide)
export const listRecipes = async () => (await db().get<RecipeSummary[]>("recipes:index")) ?? [];
export const getRecipe = (id: string) => db().get<Recipe>(`recipe:${id}`);
const summary = (r: Recipe): RecipeSummary => ({ id: r.id, title: r.title, description: r.description, timeMin: r.timeMin, tags: r.tags, nutrition: r.nutrition, batch: r.batch, rating: r.rating, favorite: r.favorite });
export async function putRecipes(recipes: Recipe[]) {
  await Promise.all(recipes.map((r) => db().set(`recipe:${r.id}`, r)));
  const index = await listRecipes();
  const byId = new Map(index.map((r) => [r.id, r]));
  for (const r of recipes) byId.set(r.id, summary(r));
  await db().set("recipes:index", [...byId.values()].sort((a, b) => b.batch.localeCompare(a.batch) || a.title.localeCompare(b.title)));
}

// ---- Weekly dinner plan
export const getMealPlan = async (uid: string, weekStart: string): Promise<MealPlan> =>
  (await db().get<MealPlan>(`mealplan:${uid}:${weekStart}`)) ?? { weekStart, days: {}, have: [], extras: [], shareToken: null };
export const saveMealPlan = (uid: string, p: MealPlan) => db().set(`mealplan:${uid}:${p.weekStart}`, p);
export const getShare = (token: string) => db().get<{ uid: string; weekStart: string }>(`groceryshare:${token}`);
export const saveShare = (token: string, v: { uid: string; weekStart: string }) => db().set(`groceryshare:${token}`, v);

// ---- Daily habits: the program's habits plus the user's own; each day's ticks
export const getCustomHabits = async (uid: string) => (await db().get<string[]>(`habits-custom:${uid}`)) ?? [];
export const saveCustomHabits = (uid: string, h: string[]) => db().set(`habits-custom:${uid}`, h);
export const getHabitLog = async (uid: string, date: string) => (await db().get<string[]>(`habitlog:${uid}:${date}`)) ?? [];
export const saveHabitLog = (uid: string, date: string, done: string[]) => db().set(`habitlog:${uid}:${date}`, done);
