"use client";
import { useEffect, useState } from "react";
import { api, localDate } from "@/lib/client";
import type { HealthBio, LabResult, Medication } from "@/lib/types";
import { IconClose } from "./icons";
import { Field } from "./ui";

const CONDITIONS = ["Prediabetes", "Insulin resistance", "Type 2 diabetes", "High blood pressure", "High cholesterol", "Sleep apnea", "Fatty liver", "GERD", "Arthritis"];
const DIET = ["Lower-carb", "High-fiber", "High-protein", "Mediterranean", "Low-sodium", "Heart-healthy"];
const ALLERGIES = ["Shellfish", "Peanuts", "Tree nuts", "Dairy", "Gluten", "Eggs", "Soy", "Fish"];
const LABS: { name: string; unit: string }[] = [
  { name: "A1C", unit: "%" }, { name: "Fasting glucose", unit: "mg/dL" }, { name: "Systolic BP", unit: "mmHg" }, { name: "Diastolic BP", unit: "mmHg" },
  { name: "LDL", unit: "mg/dL" }, { name: "HDL", unit: "mg/dL" }, { name: "Triglycerides", unit: "mg/dL" }, { name: "Weight", unit: "lb" },
];

function Tags({ options, value, onChange, placeholder }: { options: string[]; value: string[]; onChange: (v: string[]) => void; placeholder: string }) {
  const [txt, setTxt] = useState("");
  const all = [...new Set([...options, ...value])];
  const add = () => { const t = txt.trim(); if (t && !value.includes(t)) onChange([...value, t]); setTxt(""); };
  return (
    <>
      <div className="chips">
        {all.map((o) => {
          const on = value.includes(o);
          return <button type="button" key={o} className={`chip ${on ? "on" : ""}`} aria-pressed={on} onClick={() => onChange(on ? value.filter((x) => x !== o) : [...value, o])}>{o}</button>;
        })}
      </div>
      <div className="row" style={{ marginTop: 8, flexWrap: "nowrap" }}>
        <input value={txt} placeholder={placeholder} onChange={(e) => setTxt(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); add(); } }} />
        <button type="button" onClick={add} disabled={!txt.trim()}>Add</button>
      </div>
    </>
  );
}

export default function HealthBioForm() {
  const [b, setB] = useState<HealthBio | null>(null);
  const [draft, setDraft] = useState(false);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");
  const [lab, setLab] = useState({ name: "A1C", value: "", date: localDate() });
  useEffect(() => { api<{ bio: HealthBio; draft?: boolean }>("/api/health-bio").then((r) => { setB(r.bio); setDraft(!!r.draft); }, (e) => setMsg(e.message)); }, []);
  if (!b) return <main>{msg ? <p className="error">{msg}</p> : <p className="muted"><span className="spinner" />Loading…</p>}</main>;
  const bio = b;
  const set = (p: Partial<HealthBio>) => setB({ ...bio, ...p });
  const setMed = (i: number, p: Partial<Medication>) => set({ medications: b.medications.map((m, j) => (j === i ? { ...m, ...p } : m)) });

  async function save() {
    setSaving(true); setMsg("");
    try { const r = await api<{ bio: HealthBio }>("/api/health-bio", { body: b }); setB(r.bio); setDraft(false); setMsg("Saved"); }
    catch (e) { setMsg((e as Error).message); }
    setSaving(false);
  }
  function addLab() {
    const def = LABS.find((l) => l.name === lab.name);
    const v = Number(lab.value);
    if (!Number.isFinite(v) || !lab.value) return;
    const entry: LabResult = { name: lab.name, value: v, unit: def?.unit ?? "", date: lab.date };
    set({ labs: [...bio.labs, entry].sort((x, y) => (y.date || "").localeCompare(x.date || "")) });
    setLab({ ...lab, value: "" });
  }
  const latest = LABS.map((l) => b.labs.find((x) => x.name === l.name)).filter((x): x is LabResult => !!x);

  return (
    <main>
      <h1 style={{ marginBottom: 4 }}>Health bio</h1>
      <p className="small muted" style={{ marginTop: 0 }}>Private to you. Your coach uses it to plan dinners and workouts. Your doctor leads on medical decisions.</p>
      {draft && <p className="small why">Pre-filled from your setup answers — review and save.</p>}

      <section className="card">
        <Field label="Conditions"><Tags options={CONDITIONS} value={b.conditions} onChange={(v) => set({ conditions: v })} placeholder="Add another condition" /></Field>
        <Field label="Eating approach"><Tags options={DIET} value={b.dietStyle} onChange={(v) => set({ dietStyle: v })} placeholder="e.g. no fried food" /></Field>
        <Field label="Allergies / intolerances"><Tags options={ALLERGIES} value={b.allergies} onChange={(v) => set({ allergies: v })} placeholder="Add an allergy" /></Field>
        <Field label="Foods I won't eat"><Tags options={[]} value={b.dislikes} onChange={(v) => set({ dislikes: v })} placeholder="e.g. cottage cheese, beets" /></Field>
        <Field label="Alcohol"><input value={b.alcohol} onChange={(e) => set({ alcohol: e.target.value })} placeholder="e.g. none since Jan; occasional NA beer" /></Field>
      </section>

      <section className="card">
        <div className="row between"><h2 style={{ margin: 0 }}>Medications</h2><button className="link" onClick={() => set({ medications: [...b.medications, { name: "", dose: "", timing: "", purpose: "" }] })}>+ Add</button></div>
        {!b.medications.length && <p className="small muted">None listed.</p>}
        {b.medications.map((m, i) => (
          <div key={i} className="med-row">
            <div className="grid2">
              <label>Name<input value={m.name} onChange={(e) => setMed(i, { name: e.target.value })} placeholder="Metformin" /></label>
              <label>Dose<input value={m.dose} onChange={(e) => setMed(i, { dose: e.target.value })} placeholder="500 mg" /></label>
              <label>When<input value={m.timing} onChange={(e) => setMed(i, { timing: e.target.value })} placeholder="with dinner" /></label>
              <label>For<input value={m.purpose} onChange={(e) => setMed(i, { purpose: e.target.value })} placeholder="blood sugar" /></label>
            </div>
            <button className="link small danger-text" onClick={() => set({ medications: b.medications.filter((_, j) => j !== i) })}>Remove</button>
          </div>
        ))}
        <Field label="Supplements"><input value={b.supplements} onChange={(e) => set({ supplements: e.target.value })} placeholder="e.g. vitamin D, fish oil" /></Field>
      </section>

      <section className="card">
        <h2>Labs &amp; numbers</h2>
        {latest.length > 0 && (
          <div className="stats" style={{ marginBottom: 12 }}>
            {latest.map((l) => <div className="stat" key={l.name}><b className="display">{l.value}<span className="small"> {l.unit}</span></b>{l.name}{l.date ? ` · ${l.date.slice(5)}` : ""}</div>)}
          </div>
        )}
        <div className="grid2">
          <label>Test<select value={lab.name} onChange={(e) => setLab({ ...lab, name: e.target.value })}>{LABS.map((l) => <option key={l.name}>{l.name}</option>)}</select></label>
          <label>Value<input inputMode="decimal" value={lab.value} onChange={(e) => setLab({ ...lab, value: e.target.value })} placeholder={LABS.find((l) => l.name === lab.name)?.unit} /></label>
          <label>Date<input type="date" value={lab.date} onChange={(e) => setLab({ ...lab, date: e.target.value })} /></label>
          <button style={{ alignSelf: "end" }} onClick={addLab} disabled={!lab.value}>Add result</button>
        </div>
        {b.labs.length > 0 && (
          <div style={{ marginTop: 12 }}>
            {b.labs.map((l, i) => (
              <div key={i} className="row between small" style={{ padding: "6px 0", borderTop: "1px solid var(--line)" }}>
                <span>{l.name}: <b>{l.value} {l.unit}</b> <span className="muted">{l.date}</span></span>
                <button className="link" aria-label={`Remove ${l.name} ${l.date}`} onClick={() => set({ labs: b.labs.filter((_, j) => j !== i) })}><IconClose size={16} /></button>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="card">
        <Field label="Doctor / clinic"><input value={b.doctor} onChange={(e) => set({ doctor: e.target.value })} /></Field>
        <Field label="Notes"><textarea rows={4} value={b.notes} onChange={(e) => set({ notes: e.target.value })} placeholder="Anything your doctor told you to watch, goals they set, etc." /></Field>
      </section>
      {msg && <p className={msg === "Saved" ? "small" : "error"} style={{ color: msg === "Saved" ? "var(--accent)" : undefined }}>{msg}</p>}
      <button className="primary big wide" onClick={save} disabled={saving}>{saving ? "Saving…" : "Save health bio"}</button>
    </main>
  );
}
