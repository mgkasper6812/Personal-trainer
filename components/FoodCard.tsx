"use client";
import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/client";
import type { FoodEntry, Meal } from "@/lib/data";
import { MEALS } from "./FoodLogger";
import { IconClose, IconPlus } from "./icons";
import { openLog } from "./LogSheet";
import { NumberInput, Segmented } from "./ui";

export type FoodView = View;
type View = {
  targets: { proteinG: number; calories: number; carbsG: number; fatG: number; fiberG: number };
  foods: { label: string; grams: number; calories?: number; carbsG?: number; fiberG?: number }[];
  totals: { protein: number; calories: number; carbs: number; fiber: number; fat: number };
  entries: FoodEntry[];
  week: { date: string; protein: number | null; calories: number | null }[];
};
const D = ["M", "T", "W", "T", "F", "S", "S"];

/** "73 g left", "150 cal over", "Target hit" — protein and fiber are minimums, calories and carbs are limits. */
function remaining(label: string, value: number, target: number, unit: string) {
  if (!target) return "";
  const limit = label === "Calories" || label === "Carbs";
  const d = target - value;
  if (d > 0) return `${d.toLocaleString()} ${unit} left`;
  if (d === 0 || !limit) return "Target hit";
  return `${(-d).toLocaleString()} ${unit} over`;
}

/** Pick quick-add foods that close the protein gap without blowing the calorie or carb budget. */
function suggest(foods: View["foods"], protein: number, calories: number, carbs: number) {
  const picks: View["foods"] = [];
  let p = protein, c = calories, cb = carbs;
  const pool = foods.filter((f) => f.grams > 0 && f.calories).sort((a, b) => b.grams / (b.calories ?? 1) - a.grams / (a.calories ?? 1));
  while (p > 8 && picks.length < 3) {
    const f = pool.find((x) => !picks.includes(x) && (x.calories ?? 0) <= c + 50 && (x.carbsG ?? 0) <= Math.max(cb, 10));
    if (!f) break;
    picks.push(f); p -= f.grams; c -= f.calories ?? 0; cb -= f.carbsG ?? 0;
  }
  return picks;
}

function Bar({ label, value, target, unit, big = false }: { label: string; value: number; target: number; unit: string; big?: boolean }) {
  const pct = target ? Math.min(100, (value / target) * 100) : 0;
  return (
    <div className={big ? "macro big" : "macro"}>
      <div className="row between" style={{ flexWrap: "nowrap" }}>
        <span className="eyebrow">{label}</span>
        <span className="small muted">{remaining(label, value, target, unit)}</span>
      </div>
      <div className="row" style={{ alignItems: "baseline", gap: 4 }}>
        <b className="display" style={{ fontSize: big ? 30 : 20 }}>{value.toLocaleString()}</b>
        {target ? <span className="small muted">/ {target.toLocaleString()} {unit}</span> : <span className="small muted">{unit}</span>}
      </div>
      {target ? <div className={`progress ${big ? "thick" : ""}`}><div style={{ width: `${pct}%`, background: label === "Calories" && value > target ? "var(--warn)" : undefined }} /></div> : null}
    </div>
  );
}

function Remaining({ v, self }: { v: View; self: boolean }) {
  const t = v.targets, tot = v.totals;
  if (!t.calories && !t.proteinG) return null;
  const pLeft = t.proteinG - tot.protein, cLeft = t.calories - tot.calories, carbLeft = t.carbsG - tot.carbs, fLeft = t.fiberG - tot.fiber;
  const hour = new Date().getHours();
  const parts: string[] = [];
  if (pLeft > 0) parts.push(`${pLeft} g protein`);
  if (fLeft > 0) parts.push(`${fLeft} g fiber`);
  let headline: string;
  let tip: string;
  if (cLeft < 0) {
    headline = `You're ${(-cLeft).toLocaleString()} cal over today.`;
    tip = pLeft > 0 ? `Still need ${pLeft} g protein — choose lean protein and vegetables only (chicken, tuna, Greek yogurt), no starch.` : "Kitchen closed for tonight — water or herbal tea. Tomorrow's a fresh start.";
  } else if (!parts.length) {
    headline = "Protein and fiber targets hit.";
    tip = `${cLeft.toLocaleString()} cal and ${Math.max(0, carbLeft)} g carbs left if you're hungry — keep it light.`;
  } else {
    headline = `To hit today: ${parts.join(" · ")}`;
    tip = `within ${cLeft.toLocaleString()} cal and ${Math.max(0, carbLeft)} g carbs.`;
    if (pLeft > 40 && hour >= 15) tip += " That's a lot of protein for the rest of the day — make dinner protein-heavy.";
    if (fLeft > 10) tip += " Add vegetables, beans or berries for fiber.";
  }
  const picks = pLeft > 8 && cLeft > 0 ? suggest(v.foods, pLeft, cLeft, carbLeft) : [];
  return (
    <div className={`remaining ${cLeft < 0 ? "over" : ""}`}>
      <b>{headline}</b>
      <span className="small"> {tip}</span>
      {self && picks.length > 0 && (
        <div className="small" style={{ marginTop: 6 }}>
          <span className="muted">Easy way to close the gap: </span>
          {picks.map((f, i) => <span key={f.label}>{i ? " + " : ""}<b>{f.label}</b> · {f.grams} g</span>)}
          <span className="muted"> = {picks.reduce((a, f) => a + f.grams, 0)}{picks.reduce((a, f) => a + f.grams, 0) < pLeft ? ` of ${pLeft}` : ""} g protein for {picks.reduce((a, f) => a + (f.calories ?? 0), 0)} cal</span>
        </div>
      )}
    </div>
  );
}

/** Today's food totals, kept fresh when anything is logged. */
export function useFoodView(date: string, viewUser: string | null, enabled = true) {
  const [v, setV] = useState<View | null>(null);
  const load = useCallback(() => { if (enabled) api<View>(`/api/food?date=${date}${viewUser ? `&user=${viewUser}` : ""}`).then(setV, () => {}); }, [date, viewUser, enabled]);
  useEffect(() => { load(); }, [load]);
  useEffect(() => { const h = () => load(); window.addEventListener("food-logged", h); return () => window.removeEventListener("food-logged", h); }, [load]);
  return [v, setV, load] as const;
}

/** "138 g protein left" style one-liner for Home's list. */
export function foodStatus(v: View | null): { text: string; state: "done" | "part" | "todo" } {
  if (!v) return { text: "", state: "todo" };
  const left = v.targets.proteinG - v.totals.protein;
  if (v.targets.calories && v.totals.calories > v.targets.calories) return { text: `${(v.totals.calories - v.targets.calories).toLocaleString()} cal over`, state: "part" };
  if (left <= 0) return { text: "Protein hit", state: "done" };
  return { text: `${left} g protein left`, state: v.entries.length ? "part" : "todo" };
}

/** Home shows the summary (progress + what's left); the Meals → Food tab shows everything. */
export default function FoodCard({ date, self, viewUser, mode = "full", data }: { date: string; self: boolean; viewUser: string | null; mode?: "summary" | "full"; data?: ReturnType<typeof useFoodView> }) {
  const own = useFoodView(date, viewUser, !data);
  const [editing, setEditing] = useState<string | null>(null);
  const [v, setV, load] = data ?? own;
  if (!v) return mode === "summary" ? <p className="small muted" style={{ margin: 0 }}><span className="spinner" />Loading…</p> : null;

  async function save(id: string, u: Partial<FoodEntry>) {
    setV((x) => x && { ...x, entries: x.entries.map((e) => (e.id === id ? { ...e, ...u } : e)) });
    await api("/api/food", { body: { date, update: { id, ...u } } }).catch(() => {});
    load(); window.dispatchEvent(new Event("food-logged"));
  }
  async function remove(id: string) {
    setV((x) => x && { ...x, entries: x.entries.filter((e) => e.id !== id) });
    await api("/api/food", { body: { date, remove: id } }).catch(() => {});
    load();
  }
  const byMeal = (m: Meal) => v.entries.filter((e) => (e.meal ?? "snack") === m);
  const maxDay = Math.max(v.targets.proteinG * 1.2, ...v.week.map((w) => w.protein ?? 0)) || 1;

  return (
    <section className={mode === "summary" ? "card food-summary" : "card"} id="food">
      <div className="row between" style={{ flexWrap: "nowrap" }}>
        <h2 style={{ margin: 0 }}>Food today</h2>
        {self && <button className="pill-btn row" style={{ gap: 4 }} onClick={() => openLog("food")}><IconPlus size={16} />Log food</button>}
      </div>
      <div style={{ marginTop: 12 }}><Bar big label="Protein" value={v.totals.protein} target={v.targets.proteinG} unit="g" /></div>
      <div className="macro-row">
        <Bar label="Calories" value={v.totals.calories} target={v.targets.calories} unit="cal" />
        <Bar label="Carbs" value={v.totals.carbs} target={v.targets.carbsG} unit="g" />
        <Bar label="Fiber" value={v.totals.fiber} target={v.targets.fiberG} unit="g" />
      </div>

      <Remaining v={v} self={self} />
      {mode === "summary" ? (
        <a href="/meals?tab=food" className="small" style={{ display: "block", textAlign: "right", marginTop: 10 }}>
          {v.entries.length ? `${v.entries.length} item${v.entries.length > 1 ? "s" : ""} logged · ` : ""}Meals &amp; this week ›
        </a>
      ) : (<>

      <div className="meals">
        {MEALS.map((m) => {
          const es = byMeal(m.id);
          const cal = es.reduce((a, e) => a + (e.calories ?? 0), 0), p = es.reduce((a, e) => a + e.grams, 0);
          return (
            <div key={m.id} className="meal">
              <div className="row between" style={{ flexWrap: "nowrap" }}>
                <b>{m.label}</b>
                {es.length ? <span className="small muted">{cal} cal · {p} g P</span>
                  : self ? <button className="link small" onClick={() => openLog("food", m.id)}>+ Add</button> : <span className="small muted">—</span>}
              </div>
              {es.map((e) => editing === e.id ? (
                <EntryEditor key={e.id} e={e} onCancel={() => setEditing(null)} onDelete={() => { setEditing(null); remove(e.id); }}
                  onSave={async (u) => { setEditing(null); await save(e.id, u); }} />
              ) : (
                <div key={e.id} className="meal-item">
                  {self ? <button className="meal-item-main" onClick={() => setEditing(e.id)} aria-label={`Edit ${e.label}`}>
                    <span>{e.label}</span>
                    <span className="small muted">{e.calories != null ? `${e.calories} cal · ` : ""}{e.grams} g P{e.carbsG != null ? ` · ${e.carbsG} g C` : ""}</span>
                  </button> : (<>
                    <span>{e.label}</span>
                    <span className="small muted">{e.calories != null ? `${e.calories} cal · ` : ""}{e.grams} g P{e.carbsG != null ? ` · ${e.carbsG} g C` : ""}</span>
                  </>)}
                  {self && <button className="link" aria-label={`Remove ${e.label}`} onClick={() => remove(e.id)}><IconClose size={14} /></button>}
                </div>
              ))}
              {es.length > 0 && self && <button className="link small" onClick={() => openLog("food", m.id)}>+ Add to {m.label.toLowerCase()}</button>}
            </div>
          );
        })}
      </div>

      <div className="protein-week" aria-label="Protein this week">
        {v.week.map((w, i) => (
          <div key={w.date} className={w.date === date ? "sel" : ""}>
            <div className="bar-wrap">
              <div className="target-line" style={{ bottom: `${(v.targets.proteinG / maxDay) * 100}%` }} />
              <div className={`bar ${w.protein != null && w.protein >= v.targets.proteinG ? "hit" : ""}`} style={{ height: `${((w.protein ?? 0) / maxDay) * 100}%` }} />
            </div>
            <span>{D[i]}</span>
          </div>
        ))}
      </div>
      <p className="small muted" style={{ margin: 0 }}>Protein this week · dashed line = target. Estimates from photos and descriptions are approximate.</p>
      </>)}
    </section>
  );
}

/** Edit a logged item in place: move it to another meal, rename it, fix the numbers, or delete it. */
function EntryEditor({ e, onSave, onCancel, onDelete }: { e: FoodEntry; onSave: (u: Partial<FoodEntry>) => void; onCancel: () => void; onDelete: () => void }) {
  const [f, setF] = useState<FoodEntry>({ ...e, meal: e.meal ?? "snack" });
  const set = (p: Partial<FoodEntry>) => setF((x) => ({ ...x, ...p }));
  return (
    <div className="entry-edit">
      <Segmented options={MEALS.map((m) => m.id)} value={f.meal ?? "snack"} onChange={(m) => set({ meal: m as Meal })}
        labels={Object.fromEntries(MEALS.map((m) => [m.id, m.label])) as Record<Meal, string>} />
      <input className="food-name" value={f.label} onChange={(ev) => set({ label: ev.target.value })} aria-label="Food name" style={{ marginTop: 10 }} />
      <div className="macro-edit">
        <label>cal<NumberInput decimals={0} value={f.calories ?? 0} onChange={(v) => set({ calories: v ?? 0 })} /></label>
        <label>protein<NumberInput decimals={0} value={f.grams} onChange={(v) => set({ grams: v ?? 0 })} /></label>
        <label>carbs<NumberInput decimals={0} value={f.carbsG ?? 0} onChange={(v) => set({ carbsG: v ?? 0 })} /></label>
        <label>fiber<NumberInput decimals={0} value={f.fiberG ?? 0} onChange={(v) => set({ fiberG: v ?? 0 })} /></label>
      </div>
      <div className="row" style={{ gap: 8, marginTop: 10, flexWrap: "nowrap" }}>
        <button className="primary" style={{ flex: 1 }} disabled={!f.label.trim()}
          onClick={() => onSave({ label: f.label.trim(), meal: f.meal, grams: f.grams, calories: f.calories, carbsG: f.carbsG, fiberG: f.fiberG })}>Save</button>
        <button onClick={onCancel}>Cancel</button>
        <button className="danger-text" onClick={onDelete}>Delete</button>
      </div>
    </div>
  );
}
