"use client";
import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/client";
import type { FoodEntry, Meal } from "@/lib/data";
import { MEALS } from "./FoodLogger";
import { IconClose, IconPlus } from "./icons";
import { openLog } from "./LogSheet";

type View = {
  targets: { proteinG: number; calories: number; fiberG: number };
  totals: { protein: number; calories: number; carbs: number; fiber: number; fat: number };
  entries: FoodEntry[];
  week: { date: string; protein: number | null; calories: number | null }[];
};
const D = ["M", "T", "W", "T", "F", "S", "S"];

function Bar({ label, value, target, unit, big = false }: { label: string; value: number; target: number; unit: string; big?: boolean }) {
  const pct = target ? Math.min(100, (value / target) * 100) : 0;
  return (
    <div className={big ? "macro big" : "macro"}>
      <div className="row between" style={{ flexWrap: "nowrap" }}>
        <span className="eyebrow">{label}</span>
        <span className="small muted">{target ? (value >= target ? (label === "Calories" ? `${value - target} over` : "Target hit") : `${target - value} ${unit} left`) : ""}</span>
      </div>
      <div className="row" style={{ alignItems: "baseline", gap: 4 }}>
        <b className="display" style={{ fontSize: big ? 30 : 20 }}>{value.toLocaleString()}</b>
        {target ? <span className="small muted">/ {target.toLocaleString()} {unit}</span> : <span className="small muted">{unit}</span>}
      </div>
      {target ? <div className={`progress ${big ? "thick" : ""}`}><div style={{ width: `${pct}%`, background: label === "Calories" && value > target ? "var(--warn)" : undefined }} /></div> : null}
    </div>
  );
}

export default function FoodCard({ date, self, viewUser }: { date: string; self: boolean; viewUser: string | null }) {
  const [v, setV] = useState<View | null>(null);
  const load = useCallback(() => api<View>(`/api/food?date=${date}${viewUser ? `&user=${viewUser}` : ""}`).then(setV, () => {}), [date, viewUser]);
  useEffect(() => { load(); }, [load]);
  useEffect(() => { const h = () => load(); window.addEventListener("food-logged", h); return () => window.removeEventListener("food-logged", h); }, [load]);
  if (!v) return null;

  async function remove(id: string) {
    setV((x) => x && { ...x, entries: x.entries.filter((e) => e.id !== id) });
    await api("/api/food", { body: { date, remove: id } }).catch(() => {});
    load();
  }
  const byMeal = (m: Meal) => v.entries.filter((e) => (e.meal ?? "snack") === m);
  const maxDay = Math.max(v.targets.proteinG * 1.2, ...v.week.map((w) => w.protein ?? 0)) || 1;

  return (
    <section className="card" id="food">
      <div className="row between" style={{ flexWrap: "nowrap" }}>
        <h2 style={{ margin: 0 }}>Food today</h2>
        {self && <button className="pill-btn row" style={{ gap: 4 }} onClick={() => openLog("food")}><IconPlus size={16} />Log food</button>}
      </div>
      <div style={{ marginTop: 12 }}><Bar big label="Protein" value={v.totals.protein} target={v.targets.proteinG} unit="g" /></div>
      <div className="macro-row">
        <Bar label="Calories" value={v.totals.calories} target={v.targets.calories} unit="cal" />
        <Bar label="Carbs" value={v.totals.carbs} target={0} unit="g" />
        <Bar label="Fiber" value={v.totals.fiber} target={v.targets.fiberG} unit="g" />
      </div>

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
              {es.map((e) => (
                <div key={e.id} className="meal-item">
                  <span>{e.label}</span>
                  <span className="small muted">{e.calories != null ? `${e.calories} cal · ` : ""}{e.grams} g P{e.carbsG != null ? ` · ${e.carbsG} g C` : ""}</span>
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
    </section>
  );
}
