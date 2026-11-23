"use client";
import { useEffect, useState } from "react";
import BackButton from "./BackButton";
import { api, localDate } from "@/lib/client";
import { fmtQty } from "@/lib/grocery";
import type { Recipe } from "@/lib/types";
import { IconHeart } from "./icons";

export default function RecipeView({ id, canPlan }: { id: string; canPlan: boolean }) {
  const [r, setR] = useState<Recipe | null>(null);
  const [err, setErr] = useState("");
  const [msg, setMsg] = useState("");
  useEffect(() => { api<{ recipe: Recipe }>(`/api/recipes/${id}`).then((x) => setR(x.recipe), (e) => setErr(e.message)); }, [id]);
  if (!r) return <main>{err ? <p className="error">{err}</p> : <p className="muted"><span className="spinner" />Loading…</p>}</main>;
  const recipe = r;

  async function patch(p: Partial<Recipe>) {
    setR({ ...recipe, ...p });
    await api(`/api/recipes/${recipe.id}`, { method: "PATCH", body: p }).catch(() => {});
  }
  async function addToWeek() {
    const now = new Date(); const d = new Date(now); d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
    const week = localDate(d);
    const pv = await api<{ plan: { days: Record<string, string | null> }; days: string[] }>(`/api/mealplan?week=${week}`);
    const free = pv.days.find((x) => x >= localDate() && !pv.plan.days[x]);
    if (!free) { setMsg("This week is full — change a day on the Dinners tab."); return; }
    await api("/api/mealplan", { body: { week, date: free, recipeId: recipe.id } });
    setMsg(`Added to ${new Date(`${free}T12:00:00`).toLocaleDateString(undefined, { weekday: "long" })}.`);
  }

  return (
    <main>
      <BackButton fallback="/meals" />
      <div className="row between" style={{ alignItems: "flex-start", marginTop: 8, flexWrap: "nowrap" }}>
        <h1 style={{ margin: 0, flex: 1, minWidth: 0 }}>{recipe.title}</h1>
        <button className={`fav ${recipe.favorite ? "on" : ""}`} aria-label="Favorite" aria-pressed={recipe.favorite} onClick={() => patch({ favorite: !recipe.favorite })}><IconHeart size={22} /></button>
      </div>
      <p className="muted" style={{ marginTop: 6 }}>{recipe.description}</p>
      <div className="chips" style={{ marginBottom: 14 }}>
        <span className="chip static">{recipe.timeMin} min</span><span className="chip static">Serves {recipe.servings}</span>
        {recipe.tags.map((t) => <span key={t} className="chip static">{t}</span>)}
      </div>

      <section className="card">
        <span className="eyebrow">Per serving (estimate)</span>
        <div className="stats" style={{ marginTop: 10 }}>
          <div className="stat"><b className="display">{recipe.nutrition.calories}</b>cal</div>
          <div className="stat"><b className="display">{recipe.nutrition.proteinG}g</b>protein</div>
          <div className="stat"><b className="display">{recipe.nutrition.carbsG}g</b>carbs</div>
          <div className="stat"><b className="display">{recipe.nutrition.fiberG}g</b>fiber</div>
        </div>
      </section>

      <section className="card plate">
        <span className="eyebrow">Your plate</span>
        <p style={{ margin: "6px 0 0" }}>{recipe.plateTip}</p>
        {recipe.familyTip && <p className="small muted" style={{ marginBottom: 0 }}><b>For the family:</b> {recipe.familyTip}</p>}
      </section>

      <section className="card">
        <span className="eyebrow">Ingredients · serves {recipe.servings}</span>
        <ul className="checklist">
          {recipe.ingredients.map((i, k) => (
            <li key={k}><label><input type="checkbox" /><span>{[fmtQty(i.qty), i.unit && i.unit !== "each" ? i.unit : "", i.item].filter(Boolean).join(" ")}{i.note && <span className="detail">{i.note}</span>}</span></label></li>
          ))}
        </ul>
      </section>

      <section className="card">
        <span className="eyebrow">Steps</span>
        <ol className="recipe-steps">{recipe.steps.map((s, k) => <li key={k}>{s}</li>)}</ol>
      </section>

      <section className="card">
        <span className="eyebrow">How was it?</span>
        <div className="segmented" style={{ marginTop: 10 }}>
          <button className={recipe.rating === 1 ? "on" : ""} onClick={() => patch({ rating: recipe.rating === 1 ? null : 1 })}>Make again</button>
          <button className={recipe.rating === -1 ? "on" : ""} onClick={() => patch({ rating: recipe.rating === -1 ? null : -1 })}>Not for us</button>
        </div>
        <p className="small muted" style={{ marginBottom: 0 }}>Ratings shape next week&apos;s new recipes.</p>
      </section>
      {canPlan && <button className="primary big wide" onClick={addToWeek}>Add to this week</button>}
      {msg && <p className="small" style={{ color: "var(--accent)" }}>{msg}</p>}
    </main>
  );
}
