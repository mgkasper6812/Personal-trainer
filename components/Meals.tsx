"use client";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { api, localDate } from "@/lib/client";
import { fmtItem, type GroceryAisle } from "@/lib/grocery";
import type { MealPlan, RecipeSummary } from "@/lib/types";
import { IconCart, IconChevron, IconClose, IconHeart } from "./icons";

type PlanView = {
  plan: MealPlan; days: string[]; shareToken: string | null; groceries: GroceryAisle[];
  recipes: Record<string, { id: string; title: string; timeMin: number; nutrition: RecipeSummary["nutrition"]; tags: string[] }>;
};
type Library = { recipes: RecipeSummary[]; latestBatch: string | null; canFetch: boolean };
const SEGS = [["week", "This week"], ["recipes", "Recipes"], ["groceries", "Groceries"]] as const;

const monday = (d: Date) => { const x = new Date(d); x.setDate(x.getDate() - ((x.getDay() + 6) % 7)); return localDate(x); };
const shiftWeek = (w: string, n: number) => { const x = new Date(`${w}T12:00:00`); x.setDate(x.getDate() + 7 * n); return localDate(x); };
const dayName = (d: string) => new Date(`${d}T12:00:00`).toLocaleDateString(undefined, { weekday: "short" });
const dayNum = (d: string) => new Date(`${d}T12:00:00`).toLocaleDateString(undefined, { month: "short", day: "numeric" });

export default function Meals() {
  // Planning defaults to next week from Friday on (that's when new recipes arrive).
  const [week, setWeek] = useState(() => { const now = new Date(); return now.getDay() >= 5 || now.getDay() === 0 ? shiftWeek(monday(now), now.getDay() === 0 ? 0 : 1) : monday(now); });
  const [seg, setSeg] = useState<(typeof SEGS)[number][0]>("week");
  const [pv, setPv] = useState<PlanView | null>(null);
  const [lib, setLib] = useState<Library | null>(null);
  const [picking, setPicking] = useState<string | null>(null);
  const [busy, setBusy] = useState("");
  const [err, setErr] = useState("");
  const [extra, setExtra] = useState("");
  const [copied, setCopied] = useState("");

  const loadLib = useCallback(() => api<Library>("/api/recipes").then(setLib, (e) => setErr(e.message)), []);
  useEffect(() => { loadLib(); }, [loadLib]);
  useEffect(() => { setPv(null); api<PlanView>(`/api/mealplan?week=${week}`).then(setPv, (e) => setErr(e.message)); }, [week]);

  const post = async (b: Record<string, unknown>) => {
    setErr("");
    try { setPv(await api<PlanView>("/api/mealplan", { body: { week, ...b } })); } catch (e) { setErr((e as Error).message); }
  };
  async function fetchRecipes() {
    setBusy("The coach is writing new dinners for your family — about a minute…"); setErr("");
    try { await api("/api/recipes", { body: { action: "generate", date: localDate() } }); await loadLib(); }
    catch (e) { setErr((e as Error).message); }
    setBusy("");
  }
  async function toggleFav(r: RecipeSummary) {
    setLib((l) => l && { ...l, recipes: l.recipes.map((x) => (x.id === r.id ? { ...x, favorite: !x.favorite } : x)) });
    await api(`/api/recipes/${r.id}`, { method: "PATCH", body: { favorite: !r.favorite } }).catch(() => {});
  }

  const planned = pv ? pv.days.filter((d) => pv.plan.days[d]).length : 0;
  const shareUrl = pv?.shareToken && typeof window !== "undefined" ? `${window.location.origin}/g/${pv.shareToken}` : "";
  const listText = useMemo(() => pv ? pv.groceries.map((a) => [a.aisle.toUpperCase(), ...a.items.filter((i) => !pv.plan.have.includes(i.key)).map((i) => `- ${fmtItem(i)}`)].join("\n")).join("\n\n") : "", [pv]);
  const copy = async (k: string, t: string) => { try { await navigator.clipboard.writeText(t); setCopied(k); setTimeout(() => setCopied(""), 1500); } catch {} };

  const newest = lib?.recipes.filter((r) => r.batch === lib.latestBatch) ?? [];
  const favorites = lib?.recipes.filter((r) => r.favorite) ?? [];
  const rest = lib?.recipes.filter((r) => r.batch !== lib.latestBatch && !r.favorite) ?? [];

  return (
    <main>
      <div className="row between" style={{ marginBottom: 6 }}>
        <h1 style={{ margin: 0 }}>Dinners</h1>
        <div className="row" style={{ gap: 4 }}>
          <button className="pill-btn" aria-label="Previous week" onClick={() => setWeek(shiftWeek(week, -1))}>‹</button>
          <span className="small" style={{ minWidth: 92, textAlign: "center" }}>Week of {dayNum(week)}</span>
          <button className="pill-btn" aria-label="Next week" onClick={() => setWeek(shiftWeek(week, 1))}>›</button>
        </div>
      </div>
      <p className="small muted" style={{ marginTop: 0 }}>Family of 4 · built around your health bio</p>
      <div className="seg3" role="tablist">
        {SEGS.map(([k, label]) => <button key={k} role="tab" aria-selected={seg === k} className={seg === k ? "on" : ""} onClick={() => setSeg(k)}>{label}</button>)}
      </div>
      {err && <p className="error">{err}</p>}
      {busy && <p className="muted"><span className="spinner" />{busy}</p>}

      {seg === "week" && (!pv ? <p className="muted"><span className="spinner" />Loading…</p> : (<>
        <section className="card" style={{ padding: "4px 16px" }}>
          {pv.days.map((d) => {
            const id = pv.plan.days[d];
            const r = id ? pv.recipes[id] : null;
            const today = d === localDate();
            return (
              <div key={d} className={`plan-row ${today ? "today" : ""}`}>
                <div className="plan-day"><b>{dayName(d)}</b><span>{dayNum(d).split(" ")[1]}</span></div>
                {r ? (
                  <Link href={`/meals/${r.id}`} className="plan-recipe"><b>{r.title}</b><span className="small muted">{r.timeMin} min · {r.nutrition.calories} cal · {r.nutrition.carbsG}g carbs</span></Link>
                ) : (
                  <button className="plan-pick" onClick={() => setPicking(d)}>{id === null && d in pv.plan.days ? "Leftovers / out" : "+ Pick a dinner"}</button>
                )}
                {r && <button className="link" aria-label={`Change ${dayName(d)} dinner`} onClick={() => setPicking(d)}><IconChevron size={18} /></button>}
              </div>
            );
          })}
        </section>
        <div className="row" style={{ flexWrap: "nowrap" }}>
          {planned < 6 && <button className="primary" style={{ flexGrow: 1 }} onClick={() => post({ action: "autofill" })} disabled={!lib?.recipes.length}>Auto-fill the week</button>}
          <button style={{ flexGrow: 1 }} onClick={() => setSeg("groceries")} disabled={!planned}><span className="row" style={{ gap: 6, justifyContent: "center" }}><IconCart size={18} />Grocery list</span></button>
        </div>
        {!lib?.recipes.length && <p className="small muted">Your recipe library is empty — open Recipes to get your first batch.</p>}
      </>))}

      {seg === "recipes" && (!lib ? <p className="muted"><span className="spinner" />Loading…</p> : (<>
        {lib.canFetch && (
          <section className="card hero-lite">
            <h2>{lib.recipes.length ? "Missed a week? Get new dinners" : "Get your first dinners"}</h2>
            <p className="small muted">New recipes arrive automatically every Friday — about 8 family dinners tuned to your health bio and what you rate highly.</p>
            <button className="primary wide" onClick={fetchRecipes} disabled={!!busy}>Get new recipes</button>
          </section>
        )}
        {newest.length > 0 && <RecipeGroup title={`New · week of ${dayNum(lib.latestBatch!)}`} items={newest} onFav={toggleFav} />}
        {favorites.length > 0 && <RecipeGroup title="Favorites" items={favorites} onFav={toggleFav} />}
        {rest.length > 0 && <RecipeGroup title="Library" items={rest} onFav={toggleFav} />}
      </>))}

      {seg === "groceries" && (!pv ? <p className="muted"><span className="spinner" />Loading…</p> : (<>
        {!pv.groceries.length && <p className="muted">Pick dinners for the week and the list builds itself.</p>}
        {pv.groceries.length > 0 && (
          <section className="card hero-lite">
            <h2 className="row" style={{ gap: 8 }}><IconCart size={20} />Send to your store</h2>
            {!pv.shareToken ? (<>
              <p className="small muted">Make a private link to this list, then ask Claude in Chrome to add it to your Walmart, Kroger or other cart.</p>
              <button className="primary wide" onClick={() => post({ action: "share" })}>Create shareable list</button>
            </>) : (<>
              <ol className="small steps">
                <li>Open your store&apos;s site (walmart.com, kroger.com…) in Chrome and sign in.</li>
                <li>Open Claude in Chrome and paste:</li>
              </ol>
              <div className="prompt-box">Add everything on this grocery list to my cart. Pick the best-value match for each item and tell me anything you couldn&apos;t find: {shareUrl}</div>
              <div className="row" style={{ flexWrap: "nowrap", marginTop: 8 }}>
                <button className="primary" style={{ flexGrow: 1 }} onClick={() => copy("prompt", `Add everything on this grocery list to my cart. Pick the best-value match for each item and tell me anything you couldn't find: ${shareUrl}`)}>{copied === "prompt" ? "Copied" : "Copy request"}</button>
                <button style={{ flexGrow: 1 }} onClick={() => copy("text", listText)}>{copied === "text" ? "Copied" : "Copy list"}</button>
              </div>
              <p className="small muted" style={{ marginBottom: 0 }}>The link always shows the current list. Items you mark &ldquo;have it&rdquo; are left off.</p>
            </>)}
          </section>
        )}
        {pv.groceries.map((a) => (
          <section key={a.aisle} className="card">
            <span className="eyebrow">{a.aisle}</span>
            <ul className="checklist">
              {a.items.map((i) => {
                const have = pv.plan.have.includes(i.key);
                const isExtra = a.aisle === "Other" && pv.plan.extras.includes(i.item);
                return (
                  <li key={i.key}>
                    <label>
                      <input type="checkbox" checked={have} onChange={(e) => {
                        const on = e.target.checked;
                        setPv((x) => x && { ...x, plan: { ...x.plan, have: on ? [...x.plan.have, i.key] : x.plan.have.filter((k) => k !== i.key) } });
                        post({ have: i.key, on });
                      }} />
                      <span>{fmtItem(i)}{i.recipes.length > 0 && <span className="detail">{i.recipes.join(", ")}</span>}</span>
                      {isExtra && <button className="link" aria-label={`Remove ${i.item}`} onClick={(e) => { e.preventDefault(); post({ removeExtra: i.item }); }}><IconClose size={16} /></button>}
                    </label>
                  </li>
                );
              })}
            </ul>
          </section>
        ))}
        {pv.groceries.length > 0 && <p className="small muted" style={{ marginTop: -6 }}>Tick items you already have — they&apos;re left off the shared list.</p>}
        <form className="row" style={{ flexWrap: "nowrap" }} onSubmit={(e) => { e.preventDefault(); if (extra.trim()) { post({ extra }); setExtra(""); } }}>
          <input placeholder="Add an item (milk, coffee…)" value={extra} onChange={(e) => setExtra(e.target.value)} />
          <button type="submit" disabled={!extra.trim()}>Add</button>
        </form>
      </>))}

      {picking && lib && (
        <div className="sheet-backdrop" onClick={() => setPicking(null)}>
          <div className="sheet" onClick={(e) => e.stopPropagation()} role="dialog" aria-label="Pick a dinner">
            <div className="row between"><h2 style={{ margin: 0 }}>{dayName(picking)} dinner</h2><button className="link" aria-label="Close" onClick={() => setPicking(null)}><IconClose /></button></div>
            <button className="wide" style={{ margin: "12px 0" }} onClick={() => { post({ date: picking, recipeId: null }); setPicking(null); }}>Leftovers / eating out</button>
            <ul className="picker-list">
              {[...favorites, ...newest.filter((r) => !r.favorite), ...rest].filter((r) => r.rating !== -1).map((r) => (
                <li key={r.id}><button onClick={() => { post({ date: picking, recipeId: r.id }); setPicking(null); }}>
                  <b>{r.favorite ? "♥ " : ""}{r.title}</b><span className="small muted">{r.timeMin} min · {r.nutrition.calories} cal · {r.nutrition.proteinG}g protein · {r.nutrition.carbsG}g carbs</span>
                </button></li>
              ))}
              {!lib.recipes.length && <li className="small muted" style={{ padding: 12 }}>No recipes yet — get your first batch on the Recipes tab.</li>}
            </ul>
          </div>
        </div>
      )}
    </main>
  );
}

function RecipeGroup({ title, items, onFav }: { title: string; items: RecipeSummary[]; onFav: (r: RecipeSummary) => void }) {
  return (
    <section style={{ marginBottom: 8 }}>
      <span className="eyebrow">{title}</span>
      <div className="recipe-grid">
        {items.map((r) => (
          <div key={r.id} className="recipe-card">
            <Link href={`/meals/${r.id}`} className="recipe-link">
              <b>{r.title}</b>
              <span className="small muted">{r.description}</span>
              <span className="recipe-meta">{r.timeMin} min · {r.nutrition.calories} cal · {r.nutrition.carbsG}g carbs{r.rating === 1 ? " · liked" : r.rating === -1 ? " · not again" : ""}</span>
            </Link>
            <button className={`fav ${r.favorite ? "on" : ""}`} aria-label={r.favorite ? `Unfavorite ${r.title}` : `Favorite ${r.title}`} aria-pressed={r.favorite} onClick={() => onFav(r)}><IconHeart size={20} /></button>
          </div>
        ))}
      </div>
    </section>
  );
}
