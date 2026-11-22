import { AISLES } from "./schemas";
import type { Recipe } from "./types";

export type GroceryItem = { key: string; item: string; qty: number | null; unit: string; recipes: string[] };
export type GroceryAisle = { aisle: string; items: GroceryItem[] };

const norm = (s: string) => s.trim().toLowerCase().replace(/\s+/g, " ");

/** Combine the week's recipes into one list, merging the same item+unit and grouping by store aisle. */
export function buildGroceries(recipes: Recipe[], extras: string[] = []): GroceryAisle[] {
  const map = new Map<string, GroceryItem & { aisle: string }>();
  for (const r of recipes) {
    for (const ing of r.ingredients) {
      const key = `${ing.aisle}|${norm(ing.item)}|${norm(ing.unit)}`;
      const cur = map.get(key);
      if (cur) {
        cur.qty = cur.qty != null && ing.qty != null ? cur.qty + ing.qty : cur.qty ?? ing.qty;
        if (!cur.recipes.includes(r.title)) cur.recipes.push(r.title);
      } else {
        map.set(key, { key, aisle: ing.aisle, item: ing.item.trim(), qty: ing.qty, unit: ing.unit, recipes: [r.title] });
      }
    }
  }
  for (const e of extras) map.set(`Other|${norm(e)}|`, { key: `Other|${norm(e)}|`, aisle: "Other", item: e, qty: null, unit: "", recipes: [] });
  const order = [...AISLES] as string[];
  const aisles = new Map<string, GroceryItem[]>();
  for (const v of map.values()) aisles.set(v.aisle, [...(aisles.get(v.aisle) ?? []), v]);
  return [...aisles]
    .sort((a, b) => (order.indexOf(a[0]) + 100 * +(order.indexOf(a[0]) < 0)) - (order.indexOf(b[0]) + 100 * +(order.indexOf(b[0]) < 0)))
    .map(([aisle, items]) => ({ aisle, items: items.sort((x, y) => x.item.localeCompare(y.item)) }));
}

const FRACTIONS: [number, string][] = [[0.25, "¼"], [0.33, "⅓"], [0.5, "½"], [0.67, "⅔"], [0.75, "¾"]];
export function fmtQty(q: number | null) {
  if (q == null) return "";
  const whole = Math.floor(q + 0.01);
  const frac = q - whole;
  const f = FRACTIONS.find(([v]) => Math.abs(v - frac) < 0.05);
  if (frac < 0.05) return String(whole);
  return f ? `${whole || ""}${f[1]}` : String(Math.round(q * 100) / 100);
}
export const fmtItem = (i: GroceryItem) => [fmtQty(i.qty), i.unit && i.unit !== "each" ? i.unit : "", i.item].filter(Boolean).join(" ");
