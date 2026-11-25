"use client";
import { useState } from "react";
import type { SavedFood } from "@/lib/data";
import { IconClose } from "./icons";
import { NumberInput } from "./ui";

const macro = (f: SavedFood) => [`${f.grams} g P`, f.calories != null && `${f.calories} cal`].filter(Boolean).join(" · ");

/** One-tap foods as a wrapping grid of tiles (no sideways scrolling). */
export function QuickFoodGrid({ foods, dinner, onPick, onEdit }: { foods: SavedFood[]; dinner: SavedFood | null; onPick: (f: SavedFood) => void; onEdit: () => void }) {
  const [all, setAll] = useState(false);
  const shown = all ? foods : foods.slice(0, 8);
  return (
    <div style={{ marginTop: 14 }}>
      <div className="row between"><span className="eyebrow">Quick add</span><button className="link small" onClick={onEdit}>Edit</button></div>
      <div className="qa-grid">
        {dinner && (
          <button className="qa-tile tonight" onClick={() => onPick(dinner)}>
            <b>{dinner.label.replace("Dinner: ", "Tonight: ")}</b><span>{macro(dinner)}</span>
          </button>
        )}
        {shown.map((f) => <button key={f.label} className="qa-tile" onClick={() => onPick(f)}><b>{f.label}</b><span>{macro(f)}</span></button>)}
      </div>
      {foods.length > 8 && <button className="link small" style={{ marginTop: 8 }} onClick={() => setAll(!all)}>{all ? "Show fewer" : `Show all ${foods.length}`}</button>}
      {!foods.length && <p className="small muted">No quick-adds yet — tap Edit to add the foods you eat most.</p>}
    </div>
  );
}

type Edit = { index: number | null; f: SavedFood };
const BLANK: SavedFood = { label: "", grams: 0, calories: 0, carbsG: 0, fiberG: 0, fatG: 0 };

/** Add, edit, remove and reorder quick-add foods. Every change saves right away. */
export function QuickFoodManager({ foods, onSave, onDone }: { foods: SavedFood[]; onSave: (list: SavedFood[]) => Promise<void>; onDone: () => void }) {
  const [edit, setEdit] = useState<Edit | null>(null);
  const [busy, setBusy] = useState(false);
  const save = async (list: SavedFood[]) => { setBusy(true); try { await onSave(list); } finally { setBusy(false); } };
  const move = (i: number, d: -1 | 1) => { const a = [...foods]; const j = i + d; if (j < 0 || j >= a.length) return; [a[i], a[j]] = [a[j], a[i]]; save(a); };
  const commit = async () => {
    if (!edit || !edit.f.label.trim()) return;
    const f = { ...edit.f, label: edit.f.label.trim() };
    const list = edit.index === null ? [f, ...foods.filter((x) => x.label.toLowerCase() !== f.label.toLowerCase())] : foods.map((x, i) => (i === edit.index ? f : x));
    await save(list); setEdit(null);
  };
  const set = (p: Partial<SavedFood>) => setEdit((e) => (e ? { ...e, f: { ...e.f, ...p } } : e));

  return (
    <div className="qa-manage">
      <div className="row between" style={{ marginBottom: 8 }}>
        <b>Quick-add foods</b>
        <button className="primary" onClick={onDone} disabled={busy}>Done</button>
      </div>
      {edit ? (
        <div className="card qa-form">
          <label>Name<input autoFocus value={edit.f.label} placeholder="e.g. Fairlife shake" onChange={(e) => set({ label: e.target.value })} /></label>
          <div className="macro-edit">
            <label>protein g<NumberInput decimals={0} value={edit.f.grams} onChange={(v) => set({ grams: v ?? 0 })} /></label>
            <label>cal<NumberInput decimals={0} value={edit.f.calories ?? 0} onChange={(v) => set({ calories: v ?? 0 })} /></label>
            <label>carbs g<NumberInput decimals={0} value={edit.f.carbsG ?? 0} onChange={(v) => set({ carbsG: v ?? 0 })} /></label>
            <label>fiber g<NumberInput decimals={0} value={edit.f.fiberG ?? 0} onChange={(v) => set({ fiberG: v ?? 0 })} /></label>
            <label>fat g<NumberInput decimals={0} value={edit.f.fatG ?? 0} onChange={(v) => set({ fatG: v ?? 0 })} /></label>
          </div>
          <div className="row" style={{ gap: 8, marginTop: 10 }}>
            <button className="primary" onClick={commit} disabled={busy || !edit.f.label.trim()}>{edit.index === null ? "Add food" : "Save"}</button>
            <button className="link" onClick={() => setEdit(null)}>Cancel</button>
          </div>
        </div>
      ) : (
        <button className="wide" onClick={() => setEdit({ index: null, f: { ...BLANK } })}>+ Add a food</button>
      )}
      <ul className="qa-list">
        {foods.map((f, i) => (
          <li key={f.label}>
            <button className="qa-list-main" onClick={() => setEdit({ index: i, f: { ...f } })} aria-label={`Edit ${f.label}`}>
              <b>{f.label}</b><span className="small muted">{macro(f)}{f.carbsG != null ? ` · ${f.carbsG} g C` : ""}</span>
            </button>
            <button className="qa-icon" aria-label={`Move ${f.label} up`} disabled={i === 0 || busy} onClick={() => move(i, -1)}>↑</button>
            <button className="qa-icon" aria-label={`Move ${f.label} down`} disabled={i === foods.length - 1 || busy} onClick={() => move(i, 1)}>↓</button>
            <button className="qa-icon danger-text" aria-label={`Remove ${f.label}`} disabled={busy} onClick={() => save(foods.filter((_, j) => j !== i))}><IconClose size={14} /></button>
          </li>
        ))}
      </ul>
      <p className="small muted">Tap a food to edit its name or numbers. The first 8 show as tiles when you log.</p>
    </div>
  );
}
