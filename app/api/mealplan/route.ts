import { requireUser } from "@/lib/auth";
import { getMealPlan, getRecipe, listRecipes, saveMealPlan, saveShare } from "@/lib/data";
import { addDays, isDate, mondayOf } from "@/lib/dates";
import { buildGroceries } from "@/lib/grocery";
import { bad, body, handle, ok } from "@/lib/http";
import type { MealPlan, Recipe } from "@/lib/types";

async function view(uid: string, plan: MealPlan) {
  const ids = [...new Set(Object.values(plan.days).filter((x): x is string => !!x))];
  const recipes = (await Promise.all(ids.map(getRecipe))).filter((r): r is Recipe => !!r);
  const byId = Object.fromEntries(recipes.map((r) => [r.id, { id: r.id, title: r.title, timeMin: r.timeMin, nutrition: r.nutrition, tags: r.tags }]));
  // Each planned day counts once (a recipe used twice is shopped for twice).
  const perDay = Object.values(plan.days).filter((x): x is string => !!x).map((id) => recipes.find((r) => r.id === id)!).filter(Boolean);
  return {
    plan,
    days: Array.from({ length: 7 }, (_, i) => addDays(plan.weekStart, i)),
    recipes: byId,
    groceries: buildGroceries(perDay, plan.extras),
    shareToken: plan.shareToken,
  };
}

// Meal planning is the signed-in parent's own (not viewable for other members).
export const GET = handle(async (req) => {
  const me = await requireUser();
  if (me instanceof Response) return me;
  const week = new URL(req.url).searchParams.get("week");
  if (!isDate(week)) return bad("Missing week");
  return ok(await view(me.id, await getMealPlan(me.id, mondayOf(week))));
});

export const POST = handle(async (req) => {
  const me = await requireUser();
  if (me instanceof Response) return me;
  if (me.role !== "parent") return bad("Not available", 403);
  const b = await body<{ week: string; date: string; recipeId: string | null; have: string; on: boolean; extra: string; removeExtra: string; action: string }>(req);
  if (!isDate(b.week)) return bad("Missing week");
  const plan = await getMealPlan(me.id, mondayOf(b.week));
  if (isDate(b.date)) {
    if (b.recipeId === null || b.recipeId === "") plan.days[b.date] = null;
    else if (typeof b.recipeId === "string") {
      if (!(await getRecipe(b.recipeId))) return bad("Unknown recipe", 404);
      plan.days[b.date] = b.recipeId;
    }
  }
  if (typeof b.have === "string") {
    const set = new Set(plan.have);
    if (b.on) set.add(b.have); else set.delete(b.have);
    plan.have = [...set].slice(0, 300);
  }
  if (typeof b.extra === "string" && b.extra.trim()) plan.extras = [...new Set([...plan.extras, b.extra.trim().slice(0, 80)])].slice(0, 60);
  if (typeof b.removeExtra === "string") plan.extras = plan.extras.filter((x) => x !== b.removeExtra);
  if (b.action === "share" && !plan.shareToken) {
    plan.shareToken = crypto.randomUUID().replace(/-/g, "").slice(0, 24);
    await saveShare(plan.shareToken, { uid: me.id, weekStart: plan.weekStart });
  }
  if (b.action === "autofill") {
    // Fill empty days with favorites/liked first, then newest recipes, no repeats in the week.
    const all = await listRecipes();
    const ranked = [...all.filter((r) => r.favorite || r.rating === 1), ...all.filter((r) => !r.favorite && r.rating !== 1 && r.rating !== -1)];
    const used = new Set(Object.values(plan.days).filter(Boolean));
    for (let i = 0; i < 7; i++) {
      const d = addDays(plan.weekStart, i);
      if (plan.days[d]) continue;
      if (i === 6) continue; // leave Sunday open for leftovers / eating out
      const next = ranked.find((r) => !used.has(r.id));
      if (!next) break;
      plan.days[d] = next.id;
      used.add(next.id);
    }
  }
  await saveMealPlan(me.id, plan);
  return ok(await view(me.id, plan));
});
