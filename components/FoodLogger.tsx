"use client";
import { useEffect, useRef, useState } from "react";
import { api, localDate } from "@/lib/client";
import type { Meal, SavedFood } from "@/lib/data";
import type { FoodEstimate } from "@/lib/schemas";
import { IconCamera, IconImage } from "./icons";
import { toDataUrl } from "./ScreenshotImport";
import { NumberInput } from "./ui";

export const MEALS: { id: Meal; label: string }[] = [
  { id: "breakfast", label: "Breakfast" }, { id: "lunch", label: "Lunch" }, { id: "dinner", label: "Dinner" }, { id: "snack", label: "Snack" },
];
export function mealForNow(d = new Date()): Meal {
  const m = d.getHours() * 60 + d.getMinutes();
  return m < 630 ? "breakfast" : m < 900 ? "lunch" : m < 1020 ? "snack" : m < 1230 ? "dinner" : "snack";
}

type Draft = { label: string; grams: number; calories: number; carbsG: number; fiberG: number; fatG: number; assumed: boolean; keep: boolean };
type FoodView = { foods: SavedFood[]; dinner: SavedFood | null };

/** Log food by photo (plate or nutrition label), words, or one tap; review the estimate before saving. */
export default function FoodLogger({ initialMeal, onLogged }: { initialMeal?: Meal; onLogged: (summary: string) => void }) {
  const date = localDate();
  const [meal, setMeal] = useState<Meal>(initialMeal ?? mealForNow());
  const [text, setText] = useState("");
  const [photos, setPhotos] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [est, setEst] = useState<{ kind: FoodEstimate["kind"]; servingSize: string } | null>(null);
  const [servings, setServings] = useState(1);
  const [draft, setDraft] = useState<Draft[] | null>(null);
  const [save, setSave] = useState(false);
  const [view, setView] = useState<FoodView | null>(null);
  const camRef = useRef<HTMLInputElement>(null);
  const libRef = useRef<HTMLInputElement>(null);

  useEffect(() => { api<FoodView>(`/api/food?date=${date}`).then(setView, () => {}); }, [date]);

  async function estimate() {
    if (!text.trim() && !photos.length) return;
    setBusy(true); setErr("");
    try {
      const r = await api<FoodEstimate>("/api/food/estimate", { body: { text, images: photos } });
      if (r.kind === "none" || !r.items.length) { setErr("Couldn't find food in that — try a clearer photo or describe it."); setBusy(false); return; }
      setEst({ kind: r.kind, servingSize: r.servingSize }); setServings(1);
      setDraft(r.items.map((i) => ({ label: i.label, grams: i.proteinG, calories: i.calories, carbsG: i.carbsG, fiberG: i.fiberG, fatG: i.fatG, assumed: i.assumed, keep: true })));
      setSave(r.kind === "label");
    } catch (e) { setErr((e as Error).message); }
    setBusy(false);
  }
  async function addPhotos(files: FileList | null) {
    if (!files?.length) return;
    setErr("");
    const room = 4 - photos.length;
    if (room <= 0) { setErr("Up to 4 photos at a time."); return; }
    const picked = [...files].slice(0, room);
    try {
      // Several photos share one upload, so keep each a little smaller
      const urls = await Promise.all(picked.map((f) => toDataUrl(f, photos.length + picked.length > 1 ? 1200 : 1600)));
      setPhotos((p) => [...p, ...urls].slice(0, 4));
      if (files.length > room) setErr("Kept the first 4 photos.");
    } catch { setErr("Couldn't open that photo."); }
  }
  async function logItems(items: (SavedFood & { label: string })[], saveIt = false) {
    setBusy(true); setErr("");
    try {
      await api("/api/food", { body: { date, meal, addMany: items, save: saveIt } });
      const cal = items.reduce((a, i) => a + (i.calories ?? 0), 0), p = items.reduce((a, i) => a + i.grams, 0);
      window.dispatchEvent(new Event("food-logged"));
      setPhotos([]); // photos are only for reading the nutrition — never kept once logged
      onLogged(`${MEALS.find((m) => m.id === meal)!.label}: +${cal} cal · ${p} g protein`);
    } catch (e) { setErr((e as Error).message); setBusy(false); }
  }
  function confirm() {
    if (!draft) return;
    const k = est?.kind === "label" ? servings : 1;
    const items = draft.filter((d) => d.keep).map((d) => ({
      label: k !== 1 ? `${d.label} ×${k}` : d.label, grams: Math.round(d.grams * k), calories: Math.round(d.calories * k),
      carbsG: Math.round(d.carbsG * k), fiberG: Math.round(d.fiberG * k), fatG: Math.round(d.fatG * k),
    }));
    if (items.length) logItems(items, save && items.length === 1);
  }
  const set = (i: number, p: Partial<Draft>) => setDraft(draft && draft.map((d, j) => (j === i ? { ...d, ...p } : d)));
  const mult = est?.kind === "label" ? servings : 1;
  const tot = (k: keyof Draft) => Math.round((draft ?? []).filter((d) => d.keep).reduce((a, d) => a + (d[k] as number), 0) * mult);

  return (
    <div className="food-logger">
      <div className="chips">{MEALS.map((m) => <button key={m.id} className={`chip ${meal === m.id ? "on" : ""}`} onClick={() => setMeal(m.id)}>{m.label}</button>)}</div>

      {!draft && (<>
        <form className="nl-form" onSubmit={(e) => { e.preventDefault(); estimate(); }}>
          <input ref={camRef} type="file" accept="image/*" capture="environment" hidden onChange={(e) => { addPhotos(e.target.files); e.target.value = ""; }} />
          <input ref={libRef} type="file" accept="image/*" multiple hidden onChange={(e) => { addPhotos(e.target.files); e.target.value = ""; }} />
          <button type="button" className="attach-btn" aria-label="Take a food photo" onClick={() => camRef.current?.click()}><IconCamera size={22} /></button>
          <button type="button" className="attach-btn" aria-label="Choose a food photo from your library" onClick={() => libRef.current?.click()}><IconImage size={22} /></button>
          <input value={text} onChange={(e) => setText(e.target.value)} placeholder={photos.length ? "Add details (optional)" : "What did you eat? e.g. turkey sandwich and an apple"} aria-label="Describe what you ate" enterKeyHint="send" />
          <button className="primary" disabled={busy || (!text.trim() && !photos.length)}>{busy ? <span className="spinner" style={{ margin: 0 }} /> : photos.length ? "Analyze" : "Log"}</button>
        </form>
        {photos.length > 0 && (
          <div className="photo-tray" aria-label="Photos to analyze">
            {photos.map((ph, i) => (
              <div key={i} className="tray-item">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={ph} alt={`Food photo ${i + 1}`} />
                <button type="button" aria-label={`Remove photo ${i + 1}`} onClick={() => setPhotos(photos.filter((_, j) => j !== i))}>×</button>
              </div>
            ))}
            {photos.length < 4 && (
              <button type="button" className="tray-add" aria-label="Add another photo" onClick={() => libRef.current?.click()}>+</button>
            )}
          </div>
        )}
        <p className="small muted" style={{ margin: "6px 0 0" }}>Take or pick up to 4 photos (plates, a Nutrition Facts label), add details if you like, or just type it.</p>
        {busy && photos.length > 0 && <p className="small muted"><span className="spinner" />Looking at your photo{photos.length > 1 ? "s" : ""}…</p>}
        {view && (
          <div className="chips scroll-x" style={{ marginTop: 12 }}>
            {view.dinner && <button className="chip on" onClick={() => logItems([view.dinner!])}>{view.dinner.label.replace("Dinner: ", "Tonight: ")}</button>}
            {view.foods.map((f) => <button key={f.label} className="chip" onClick={() => logItems([f])}>{f.label} · {f.grams}g P</button>)}
          </div>
        )}
      </>)}

      {draft && (
        <div className="nl-draft">
          <div className="row" style={{ gap: 10, flexWrap: "nowrap", alignItems: "flex-start" }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            {photos.slice(0, 3).map((ph, i) => <img key={i} src={ph} alt={`Your food ${i + 1}`} className="import-thumb" style={{ width: 48, height: 48 }} />)}
            <div style={{ flex: 1 }}>
              <span className="eyebrow">{est?.kind === "label" ? "From the label" : "Check the estimate"}</span>
              {est?.kind === "label" && est.servingSize && <p className="small muted" style={{ margin: "2px 0 0" }}>1 serving = {est.servingSize}</p>}
            </div>
          </div>
          {est?.kind === "label" && (
            <div className="row" style={{ margin: "10px 0", gap: 8 }}>
              <span className="small">Servings you ate</span>
              {[0.5, 1, 1.5, 2].map((x) => <button key={x} className={`chip ${servings === x ? "on" : ""}`} onClick={() => setServings(x)}>{x}</button>)}
            </div>
          )}
          {draft.map((d, i) => (
            <div key={i} className="food-row">
              <input type="checkbox" checked={d.keep} aria-label={`Include ${d.label}`} onChange={(e) => set(i, { keep: e.target.checked })} />
              <div style={{ minWidth: 0 }}>
                <input className="food-name" value={d.label} onChange={(e) => set(i, { label: e.target.value })} aria-label="Food name" />
                {d.assumed && <span className="small muted">portion estimated — adjust if needed</span>}
                <div className="macro-edit">
                  <label>cal<NumberInput decimals={0} value={d.calories} onChange={(v) => set(i, { calories: v ?? 0 })} /></label>
                  <label>protein<NumberInput decimals={0} value={d.grams} onChange={(v) => set(i, { grams: v ?? 0 })} /></label>
                  <label>carbs<NumberInput decimals={0} value={d.carbsG} onChange={(v) => set(i, { carbsG: v ?? 0 })} /></label>
                  <label>fiber<NumberInput decimals={0} value={d.fiberG} onChange={(v) => set(i, { fiberG: v ?? 0 })} /></label>
                </div>
              </div>
            </div>
          ))}
          {draft.length === 1 && (
            <label className="small" style={{ flexDirection: "row", alignItems: "center", gap: 6, marginTop: 8 }}>
              <input type="checkbox" checked={save} onChange={(e) => setSave(e.target.checked)} style={{ width: 18, height: 18 }} />Save as a quick-add
            </label>
          )}
          <div className="row" style={{ flexWrap: "nowrap", marginTop: 10 }}>
            <button className="primary" style={{ flexGrow: 1 }} onClick={confirm} disabled={busy}>Add {tot("calories")} cal · {tot("grams")} g protein</button>
            <button onClick={() => { setDraft(null); setEst(null); }}>Back</button>
          </div>
        </div>
      )}
      {err && <p className="error">{err}</p>}
    </div>
  );
}
