"use client";
import { useEffect, useState } from "react";
import { api } from "@/lib/client";
import type { ProgramRecord } from "@/lib/data";
import { getExercise } from "@/lib/exercises";
import type { Routine, RoutineExercise } from "@/lib/schemas";
import { fmtClock } from "@/lib/workout-client";
import ExercisePicker from "./ExercisePicker";
import { Stepper } from "./ui";

export default function RoutineEditor({ routineKey }: { routineKey: string }) {
  const [rt, setRt] = useState<Routine | null>(null);
  const [picker, setPicker] = useState(false);
  const [err, setErr] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api<{ record: ProgramRecord | null }>("/api/program").then((r) => setRt(r.record?.program.routines.find((x) => x.key === routineKey) ?? null), (e) => setErr(e.message));
  }, [routineKey]);

  if (!rt) return <main>{err ? <p className="error">{err}</p> : <p className="muted"><span className="spinner" />Loading…</p>}</main>;
  const setEx = (i: number, patch: Partial<RoutineExercise>) => setRt({ ...rt, exercises: rt.exercises.map((e, j) => (j === i ? { ...e, ...patch } : e)) });
  const move = (i: number, d: -1 | 1) => { const a = [...rt.exercises]; const j = i + d; if (j < 0 || j >= a.length) return; [a[i], a[j]] = [a[j], a[i]]; setRt({ ...rt, exercises: a }); };

  async function save() {
    setSaving(true); setErr("");
    try { await api("/api/program", { method: "PUT", body: { routine: rt } }); window.location.href = "/routines"; }
    catch (e) { setErr((e as Error).message); setSaving(false); }
  }

  return (
    <main>
      <div className="row between">
        <a href="/routines">Cancel</a>
        <button className="primary" onClick={save} disabled={saving}>{saving ? "Saving…" : "Save"}</button>
      </div>
      <input className="title-input" style={{ margin: "14px 0 4px" }} value={rt.name} onChange={(e) => setRt({ ...rt, name: e.target.value })} />
      <p className="small muted">{rt.purpose}</p>
      {rt.exercises.map((e, i) => {
        const ex = getExercise(e.exerciseId)!;
        const repsKind = ex.kind === "weight_reps" || ex.kind === "reps" || ex.kind === "jump";
        return (
          <div className="card" key={`${e.exerciseId}-${i}`}>
            <div className="row between">
              <b>{ex.name}</b>
              <span className="row" style={{ gap: 4 }}>
                <button onClick={() => move(i, -1)} aria-label="Move up">↑</button>
                <button onClick={() => move(i, 1)} aria-label="Move down">↓</button>
                <button className="danger-text" onClick={() => setRt({ ...rt, exercises: rt.exercises.filter((_, j) => j !== i) })} aria-label="Remove">✕</button>
              </span>
            </div>
            <div className="grid2" style={{ marginTop: 10 }}>
              <label>Sets<Stepper value={e.sets} onChange={(v) => setEx(i, { sets: Math.max(1, v ?? 1) })} min={1} max={10} /></label>
              {repsKind && <label>Reps (min–max)
                <div className="row" style={{ gap: 6, flexWrap: "nowrap" }}>
                  <input inputMode="numeric" value={e.repsMin ?? ""} onChange={(ev) => setEx(i, { repsMin: ev.target.value ? Number(ev.target.value) : null })} />
                  <span>–</span>
                  <input inputMode="numeric" value={e.repsMax ?? ""} onChange={(ev) => setEx(i, { repsMax: ev.target.value ? Number(ev.target.value) : null })} />
                </div></label>}
              {ex.kind === "duration" && <label>Seconds<input inputMode="numeric" value={e.seconds ?? ""} onChange={(ev) => setEx(i, { seconds: ev.target.value ? Number(ev.target.value) : null })} /></label>}
              {ex.kind === "cardio" && <label>Minutes<input inputMode="numeric" value={e.minutes ?? ""} onChange={(ev) => setEx(i, { minutes: ev.target.value ? Number(ev.target.value) : null })} /></label>}
              {(ex.kind === "swings" || ex.kind === "throws") && <label>Per set<input inputMode="numeric" value={e.count ?? ""} onChange={(ev) => setEx(i, { count: ev.target.value ? Number(ev.target.value) : null })} /></label>}
              <label>Rest
                <select value={e.restSec} onChange={(ev) => setEx(i, { restSec: Number(ev.target.value) })}>
                  {[0, 30, 45, 60, 90, 120, 150, 180, 240].map((s) => <option key={s} value={s}>{s ? fmtClock(s) : "Off"}</option>)}
                </select></label>
              <label>Superset
                <select value={e.superset ?? ""} onChange={(ev) => setEx(i, { superset: ev.target.value || null })}>
                  <option value="">None</option>{["A", "B", "C"].map((x) => <option key={x}>{x}</option>)}
                </select></label>
            </div>
          </div>
        );
      })}
      <button className="wide" onClick={() => setPicker(true)}>+ Add exercise</button>
      {err && <p className="error">{err}</p>}
      {picker && <ExercisePicker onClose={() => setPicker(false)} onPick={(ex) => {
        const reps = ex.kind === "weight_reps" || ex.kind === "reps";
        setRt({ ...rt, exercises: [...rt.exercises, { exerciseId: ex.id, sets: 3, warmupSets: 0, repsMin: reps ? 8 : null, repsMax: reps ? 12 : null,
          seconds: ex.kind === "duration" ? 30 : null, minutes: ex.kind === "cardio" ? 20 : null, count: ex.kind === "swings" || ex.kind === "throws" ? 10 : null,
          weightLb: null, targetRpe: null, tempo: null, restSec: 90, superset: null, notes: null }] });
        setPicker(false);
      }} />}
    </main>
  );
}
