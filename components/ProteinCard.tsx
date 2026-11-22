"use client";
import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/client";
import { IconClose, IconPlus } from "./icons";

type Food = { label: string; grams: number };
type View = {
  target: number; total: number; entries: { id: string; label: string; grams: number; at: string }[];
  foods: Food[]; custom: string[]; dinner: Food | null; week: { date: string; total: number | null }[];
};
const D = ["M", "T", "W", "T", "F", "S", "S"];

export default function ProteinCard({ date, self, viewUser }: { date: string; self: boolean; viewUser: string | null }) {
  const [v, setV] = useState<View | null>(null);
  const [custom, setCustom] = useState(false);
  const [label, setLabel] = useState("");
  const [grams, setGrams] = useState("");
  const [save, setSave] = useState(true);
  const [err, setErr] = useState("");
  const [showLog, setShowLog] = useState(false);

  const load = useCallback(() => api<View>(`/api/protein?date=${date}${viewUser ? `&user=${viewUser}` : ""}`).then(setV, (e) => setErr(e.message)), [date, viewUser]);
  useEffect(() => { load(); }, [load]);

  async function post(b: Record<string, unknown>) {
    setErr("");
    try { setV(await api<View>("/api/protein", { body: { date, ...b } })); } catch (e) { setErr((e as Error).message); }
  }
  async function add(f: Food, saveIt = false) {
    if (v) setV({ ...v, total: v.total + f.grams, entries: [...v.entries, { id: "tmp", label: f.label, grams: f.grams, at: "" }] });
    await post({ add: f, save: saveIt });
  }
  if (!v || !v.target) return null;
  const pct = Math.min(100, (v.total / v.target) * 100);
  const left = Math.max(0, v.target - v.total);
  const maxDay = Math.max(v.target * 1.2, ...v.week.map((w) => w.total ?? 0));

  return (
    <section className="card">
      <div className="row between">
        <span className="eyebrow">Protein</span>
        <span className="small muted">{left ? `${left} g to go` : "Target hit"}</span>
      </div>
      <div className="row" style={{ alignItems: "baseline", gap: 6, margin: "4px 0 8px" }}>
        <b className="display big-num" style={{ color: left ? "var(--text)" : "var(--accent)" }}>{v.total}</b>
        <span className="muted">/ {v.target} g</span>
      </div>
      <div className="progress thick"><div style={{ width: `${pct}%` }} /></div>

      {self && (<>
        <div className="chips scroll-x" style={{ marginTop: 12 }}>
          {v.dinner && <button className="chip on" onClick={() => add(v.dinner!)}>+{v.dinner.grams} g · {v.dinner.label.replace("Dinner: ", "Dinner")}</button>}
          {v.foods.map((f) => <button key={f.label} className="chip" onClick={() => add(f)}>+{f.grams} · {f.label}</button>)}
          <button className="chip" onClick={() => setCustom(!custom)} aria-label="Add custom food"><IconPlus size={16} /></button>
        </div>
        {custom && (
          <form className="protein-form" onSubmit={(e) => { e.preventDefault(); add({ label, grams: Number(grams) }, save); setLabel(""); setGrams(""); setCustom(false); }}>
            <input placeholder="What (e.g. Fairlife shake)" value={label} onChange={(e) => setLabel(e.target.value)} />
            <input inputMode="numeric" placeholder="g" value={grams} onChange={(e) => setGrams(e.target.value.replace(/\D/g, ""))} style={{ width: 70, flex: "none" }} aria-label="Grams of protein" />
            <button className="primary" disabled={!grams}>Add</button>
            <label className="small" style={{ flexDirection: "row", alignItems: "center", gap: 6, gridColumn: "1 / -1" }}>
              <input type="checkbox" checked={save} onChange={(e) => setSave(e.target.checked)} style={{ width: 18, height: 18 }} />Save as a quick-add button
            </label>
          </form>
        )}
      </>)}
      {err && <p className="error">{err}</p>}

      <div className="protein-week" aria-label="Protein this week">
        {v.week.map((w, i) => (
          <div key={w.date} className={w.date === date ? "sel" : ""}>
            <div className="bar-wrap">
              <div className="target-line" style={{ bottom: `${(v.target / maxDay) * 100}%` }} />
              <div className={`bar ${w.total != null && w.total >= v.target ? "hit" : ""}`} style={{ height: `${((w.total ?? 0) / maxDay) * 100}%` }} />
            </div>
            <span>{D[i]}</span>
          </div>
        ))}
      </div>

      {v.entries.length > 0 && (
        <>
          <button className="link small" onClick={() => setShowLog(!showLog)}>{showLog ? "Hide" : "Show"} today&apos;s log ({v.entries.length})</button>
          {showLog && (
            <ul className="protein-log">
              {v.entries.map((e) => (
                <li key={e.id}>
                  <span>{e.label}</span><b>{e.grams} g</b>
                  {self && e.id !== "tmp" && <button className="link" aria-label={`Remove ${e.label}`} onClick={() => post({ remove: e.id })}><IconClose size={16} /></button>}
                </li>
              ))}
            </ul>
          )}
        </>
      )}
      {self && v.custom.length > 0 && showLog && (
        <p className="small muted">Saved foods: {v.custom.map((c) => <button key={c} className="link small" style={{ marginRight: 8 }} onClick={() => post({ removeFood: c })}>{c} ✕</button>)}</p>
      )}
    </section>
  );
}
