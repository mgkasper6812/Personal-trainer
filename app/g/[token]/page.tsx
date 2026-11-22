import type { Metadata } from "next";
import { getMealPlan, getRecipe, getShare } from "@/lib/data";
import { buildGroceries, fmtItem } from "@/lib/grocery";
import type { Recipe } from "@/lib/types";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Grocery list", robots: { index: false, follow: false } };

// Public, read-only grocery list for an assistant like Claude in Chrome to read and add to a store cart.
export default async function Page({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const share = /^[a-f0-9]{24}$/.test(token) ? await getShare(token) : null;
  if (!share) return <main><h1>List not found</h1></main>;
  const plan = await getMealPlan(share.uid, share.weekStart);
  const ids = Object.values(plan.days).filter((x): x is string => !!x);
  const recipes = (await Promise.all(ids.map(getRecipe))).filter((r): r is Recipe => !!r);
  const aisles = buildGroceries(recipes, plan.extras);
  const have = new Set(plan.have);
  const titles = [...new Set(recipes.map((r) => r.title))];
  const week = new Date(`${plan.weekStart}T12:00:00`).toLocaleDateString("en-US", { month: "long", day: "numeric" });
  return (
    <main style={{ paddingBottom: 40 }}>
      <h1>Grocery list — week of {week}</h1>
      <p className="small muted">For a family of 4. Quantities are totals for the week. Items already at home are left off.</p>
      <p className="small muted">Dinners: {titles.join(" · ")}</p>
      {aisles.map((a) => {
        const items = a.items.filter((i) => !have.has(i.key));
        if (!items.length) return null;
        return (
          <section key={a.aisle} className="card">
            <h2>{a.aisle}</h2>
            <ul>{items.map((i) => <li key={i.key} style={{ margin: "6px 0" }}>{fmtItem(i)}</li>)}</ul>
          </section>
        );
      })}
    </main>
  );
}
