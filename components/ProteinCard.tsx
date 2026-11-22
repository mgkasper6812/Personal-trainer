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
  const [text, setText] = useState("");
  const [estimating, setEstimating] = useState(false);
  const [draft, setDraft] = useState<{ label: string; grams: number; assumed: boolean; keep: boolean }[] | null>(null);

  async function estimate(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim()) return;
    setEstimating(true); setErr("");
    try {
      const r = await api<{ items: { label: string; grams: number; assumed: boolean }[] }>("/api/protein/estimate", { body: { text } });
      if (!r.items.length) setErr("Couldn't find any food in that — try again with what and how much.");
      setDraft(r.items.map((i) => ({ ...i, keep: true })));
    } catch (e) { setErr((e as Error).message); }
    setEstimating(false);
  }
  async function confirmDraft() {
    if (!draft) return;
    const items = draft.filter((d) => d.keep && d.grams > 0).map(({ label, grams }) => ({ label, grams }));
    setDraft(null); setText("");
    if (items.length) await post({ addMany: items });
  }

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
        <form className="nl-form" onSubmit={estimate}>
          <input value={text} onChange={(e) => setText(e.target.value)} placeholder="What did you eat? e.g. 2 eggs and a Fairlife shake" aria-label="Describe what you ate" enterKeyHint="send" />
          <button className="primary" disabled={!text.trim() || estimating}>{estimating ? <span className="spinner" style={{ margin: 0 }} /> : "Log"}</button>
        </form>
        {draft && draft.length > 0 && (
          <div className="nl-draft">
            <span className="eyebrow">Check the estimate</span>
            {draft.map((d, i) => (
              <div key={i} className="nl-row">
                <input type="checkbox" checked={d.keep} aria-label={`Include ${d.label}`} onChange={(e) => setDraft(draft.map((x, j) => (j === i ? { ...x, keep: e.target.checked } : x)))} />
                <span className={d.keep ? "" : "muted"}>{d.label}{d.assumed && <span className="detail small muted"> · assumed 1 serving</span>}</span>
                <input inputMode="numeric" value={d.grams} aria-label={`Grams for ${d.label}`} onChange={(e) => setDraft(draft.map((x, j) => (j === i ? { ...x, grams: Number(e.target.value.replace(/\D/g, "")) || 0 } : x)))} />
                <span className="small muted">g</span>
              </div>
            ))}
            <div className="row" style={{ flexWrap: "nowrap", marginTop: 10 }}>
              <button className="primary" style={{ flexGrow: 1 }} onClick={confirmDraft}>Add {draft.filter((d) => d.keep).reduce((a, d) => a + d.grams, 0)} g</button>
              <button onClick={() => setDraft(null)}>Cancel</button>
            </div>
          </div>
        )}
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
