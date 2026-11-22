import { requireUser } from "@/lib/auth";
import { listRecipes } from "@/lib/data";
import { daysBetween } from "@/lib/dates";
import { bad, body, handle, ok } from "@/lib/http";
import { addRecipeBatch } from "@/lib/recipes";

export const maxDuration = 300;

export const GET = handle(async () => {
  const me = await requireUser();
  if (me instanceof Response) return me;
  const recipes = await listRecipes();
  const latest = recipes.reduce((a, r) => (r.batch > a ? r.batch : a), "");
  const today = new Date().toISOString().slice(0, 10);
  // New dinners arrive automatically each week; this only offers a manual fetch if the library is empty or a week was missed.
  const canFetch = me.role === "parent" && (!latest || daysBetween(latest, today) > 13);
  return ok({ recipes, latestBatch: latest || null, canFetch });
});

export const POST = handle(async (req) => {
  const me = await requireUser();
  if (me instanceof Response) return me;
  if (me.role !== "parent") return bad("Only a parent can add recipes", 403);
  const b = await body<{ action: string; date: string }>(req);
  if (b.action !== "generate") return bad("Unknown action");
  const recipes = await addRecipeBatch(me.id, typeof b.date === "string" ? b.date : undefined);
  return ok({ added: recipes.length });
});
