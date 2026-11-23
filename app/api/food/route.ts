import { requireUser, resolveTarget } from "@/lib/auth";
import {
  getFoodLog, getMealPlan, getProfile, getProgram, getRecipe, getSavedFoods, saveFoodLog, saveSavedFoods,
  type FoodEntry, type Meal, type SavedFood,
} from "@/lib/data";
import { addDays, isDate, mondayOf } from "@/lib/dates";
import { bad, body, handle, ok } from "@/lib/http";

const MEALS: Meal[] = ["breakfast", "lunch", "dinner", "snack"];
const DEFAULT_FOODS: SavedFood[] = [
  { label: "Protein shake", grams: 30, calories: 160, carbsG: 5, fiberG: 1, fatG: 3 },
  { label: "Greek yogurt (1 cup)", grams: 23, calories: 130, carbsG: 9, fiberG: 0, fatG: 0 },
  { label: "2 eggs", grams: 12, calories: 140, carbsG: 1, fiberG: 0, fatG: 10 },
  { label: "Chicken breast (6 oz)", grams: 52, calories: 280, carbsG: 0, fiberG: 0, fatG: 6 },
  { label: "Lean beef (6 oz)", grams: 42, calories: 300, carbsG: 0, fiberG: 0, fatG: 14 },
  { label: "Tuna (1 can)", grams: 26, calories: 120, carbsG: 0, fiberG: 0, fatG: 1 },
  { label: "Deli turkey (3 oz)", grams: 15, calories: 90, carbsG: 2, fiberG: 0, fatG: 1 },
  { label: "Cheese stick", grams: 7, calories: 80, carbsG: 1, fiberG: 0, fatG: 6 },
  { label: "Protein bar", grams: 20, calories: 200, carbsG: 22, fiberG: 5, fatG: 7 },
];
const n = (v: unknown, max: number) => { const x = Math.round(Number(v)); return Number.isFinite(x) && x >= 0 && x <= max ? x : undefined; };
const clean = (f: Partial<SavedFood> & { label?: unknown }) => ({
  label: String(f.label ?? "").trim().slice(0, 60), grams: n(f.grams, 300) ?? 0,
  calories: n(f.calories, 3000), carbsG: n(f.carbsG, 500), fiberG: n(f.fiberG, 150), fatG: n(f.fatG, 300),
});
const sum = (es: FoodEntry[], k: keyof FoodEntry) => es.reduce((a, e) => a + (Number(e[k]) || 0), 0);

async function view(uid: string, date: string) {
  const [program, saved, entries, profile] = await Promise.all([getProgram(uid), getSavedFoods(uid), getFoodLog(uid, date), getProfile(uid)]);
  const monday = mondayOf(date);
  const days = Array.from({ length: 7 }, (_, i) => addDays(monday, i));
  const week = await Promise.all(days.map(async (d) => {
    if (d > date) return { date: d, protein: null, calories: null };
    const es = await getFoodLog(uid, d);
    return { date: d, protein: sum(es, "grams"), calories: sum(es, "calories") };
  }));
  const plan = await getMealPlan(uid, monday);
  const rid = plan.days[date];
  const recipe = rid ? await getRecipe(rid) : null;
  const nut = program?.program.nutrition;
  const proteinG = nut?.proteinG ?? (profile?.kind === "adult" ? Math.round((profile.targetWeightLb ?? profile.weightLb) * 0.8) : 0);
  const calories = nut?.calories ?? 0;
  // Carbs and fat aren't in the plan, so derive them: protein first, ~30% of calories from fat, the rest carbs.
  const fatG = calories ? Math.round((calories * 0.3) / 9) : 0;
  const carbsG = calories ? Math.max(0, Math.round((calories - proteinG * 4 - fatG * 9) / 4)) : 0;
  return {
    targets: { proteinG, calories, carbsG, fatG, fiberG: 30 /* a common goal for blood-sugar control */ },
    totals: { protein: sum(entries, "grams"), calories: sum(entries, "calories"), carbs: sum(entries, "carbsG"), fiber: sum(entries, "fiberG"), fat: sum(entries, "fatG") },
    entries,
    foods: [...saved, ...DEFAULT_FOODS.filter((d) => !saved.some((f) => f.label.toLowerCase() === d.label.toLowerCase()))],
    custom: saved.map((f) => f.label),
    dinner: recipe ? { label: `Dinner: ${recipe.title}`, grams: recipe.nutrition.proteinG, calories: recipe.nutrition.calories, carbsG: recipe.nutrition.carbsG, fiberG: recipe.nutrition.fiberG, fatG: recipe.nutrition.fatG } : null,
    week,
  };
}

export const GET = handle(async (req) => {
  const me = await requireUser();
  if (me instanceof Response) return me;
  const url = new URL(req.url);
  const date = url.searchParams.get("date");
  if (!isDate(date)) return bad("Missing date");
  const target = await resolveTarget(me, url.searchParams.get("user"));
  if (!target) return bad("Not allowed", 403);
  return ok(await view(target.id, date));
});

// add: one item, addMany: several (with meal), save: keep as a quick-add, remove: entry id, removeFood: saved label
export const POST = handle(async (req) => {
  const me = await requireUser();
  if (me instanceof Response) return me;
  if (me.role !== "parent") return bad("Not available", 403);
  const b = await body<{ date: string; meal: Meal; add: SavedFood; addMany: SavedFood[]; save: boolean; remove: string; removeFood: string }>(req);
  if (!isDate(b.date)) return bad("Missing date");
  const meal = MEALS.includes(b.meal as Meal) ? (b.meal as Meal) : "snack";
  let entries = await getFoodLog(me.id, b.date);
  const items = [...(b.add ? [b.add] : []), ...(Array.isArray(b.addMany) ? b.addMany.slice(0, 15) : [])].map(clean).filter((f) => f.label && (f.grams || f.calories));
  if (items.length) {
    entries = [...entries, ...items.map((f) => ({ ...f, id: crypto.randomUUID().slice(0, 8), at: new Date().toISOString(), meal }))].slice(-60);
    await saveFoodLog(me.id, b.date, entries);
    if (b.save && items.length === 1) {
      const saved = (await getSavedFoods(me.id)).filter((f) => f.label.toLowerCase() !== items[0].label.toLowerCase());
      await saveSavedFoods(me.id, [items[0], ...saved].slice(0, 24));
    }
  }
  if (typeof b.remove === "string") await saveFoodLog(me.id, b.date, (entries = entries.filter((e) => e.id !== b.remove)));
  if (typeof b.removeFood === "string") await saveSavedFoods(me.id, (await getSavedFoods(me.id)).filter((f) => f.label !== b.removeFood));
  return ok(await view(me.id, b.date));
});
