import { requireUser, resolveTarget } from "@/lib/auth";
import {
  getMealPlan, getProfile, getProgram, getProteinFoods, getProteinLog, getRecipe, saveProteinFoods, saveProteinLog,
  type ProteinEntry, type ProteinFood,
} from "@/lib/data";
import { addDays, isDate, mondayOf } from "@/lib/dates";
import { bad, body, handle, ok } from "@/lib/http";

const DEFAULT_FOODS: ProteinFood[] = [
  { label: "Protein shake", grams: 30 }, { label: "Greek yogurt (1 cup)", grams: 20 }, { label: "2 eggs", grams: 12 },
  { label: "Chicken breast (6 oz)", grams: 42 }, { label: "Lean beef (6 oz)", grams: 40 }, { label: "Tuna (1 can)", grams: 25 },
  { label: "Deli turkey (3 oz)", grams: 15 }, { label: "Cheese stick", grams: 7 }, { label: "Protein bar", grams: 20 },
];

async function view(uid: string, date: string) {
  const [program, foods, entries, profile] = await Promise.all([getProgram(uid), getProteinFoods(uid), getProteinLog(uid, date), getProfile(uid)]);
  const monday = mondayOf(date);
  const days = Array.from({ length: 7 }, (_, i) => addDays(monday, i));
  const totals = await Promise.all(days.map(async (d) => (d <= date ? (await getProteinLog(uid, d)).reduce((a, e) => a + e.grams, 0) : null)));
  // Tonight's planned dinner, as one tap
  const plan = await getMealPlan(uid, monday);
  const rid = plan.days[date];
  const recipe = rid ? await getRecipe(rid) : null;
  const target = program?.program.nutrition?.proteinG ?? (profile?.kind === "adult" ? Math.round((profile.targetWeightLb ?? profile.weightLb) * 0.8) : 0);
  return {
    target,
    entries,
    total: entries.reduce((a, e) => a + e.grams, 0),
    foods: [...foods, ...DEFAULT_FOODS.filter((d) => !foods.some((f) => f.label.toLowerCase() === d.label.toLowerCase()))],
    custom: foods.map((f) => f.label),
    dinner: recipe ? { label: `Dinner: ${recipe.title}`, grams: recipe.nutrition.proteinG } : null,
    week: days.map((d, i) => ({ date: d, total: totals[i] })),
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

export const POST = handle(async (req) => {
  const me = await requireUser();
  if (me instanceof Response) return me;
  const b = await body<{ date: string; add: ProteinFood; addMany: ProteinFood[]; save: boolean; remove: string; removeFood: string }>(req);
  if (!isDate(b.date)) return bad("Missing date");
  let entries = await getProteinLog(me.id, b.date);
  if (b.add && typeof b.add.label === "string") {
    const grams = Math.round(Number(b.add.grams));
    if (!Number.isFinite(grams) || grams <= 0 || grams > 300) return bad("Enter grams between 1 and 300");
    const label = b.add.label.trim().slice(0, 60) || `${grams} g protein`;
    entries = [...entries, { id: crypto.randomUUID().slice(0, 8), label, grams, at: new Date().toISOString() }].slice(-40);
    await saveProteinLog(me.id, b.date, entries);
    if (b.save) {
      const foods = (await getProteinFoods(me.id)).filter((f) => f.label.toLowerCase() !== label.toLowerCase());
      await saveProteinFoods(me.id, [{ label, grams }, ...foods].slice(0, 20));
    }
  }
  if (Array.isArray(b.addMany)) {
    const add = b.addMany.slice(0, 15).map((f) => ({ label: String(f?.label ?? "").trim().slice(0, 60), grams: Math.round(Number(f?.grams)) }))
      .filter((f) => f.label && Number.isFinite(f.grams) && f.grams > 0 && f.grams <= 300);
    entries = [...entries, ...add.map((f) => ({ id: crypto.randomUUID().slice(0, 8), label: f.label, grams: f.grams, at: new Date().toISOString() }))].slice(-40);
    await saveProteinLog(me.id, b.date, entries);
  }
  if (typeof b.remove === "string") {
    entries = entries.filter((e) => e.id !== b.remove);
    await saveProteinLog(me.id, b.date, entries);
  }
  if (typeof b.removeFood === "string") await saveProteinFoods(me.id, (await getProteinFoods(me.id)).filter((f) => f.label !== b.removeFood));
  return ok(await view(me.id, b.date));
});
