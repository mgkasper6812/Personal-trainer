"use client";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { api } from "@/lib/client";
import type { ExerciseStats } from "@/lib/data";
import { getExercise } from "@/lib/exercises";
import type { LoggedSet, SetType, Workout } from "@/lib/types";
import {
  buildExercise, columns, fmtClock, formatSet, loadActive, saveActive, targetLabel,
  type ActiveExercise, type ActiveWorkout,
} from "@/lib/workout-client";
import ExercisePicker from "./ExercisePicker";
import { ExerciseSheet } from "./ExerciseInfo";

const NEXT_TYPE: Record<SetType, SetType> = { normal: "warmup", warmup: "drop", drop: "failure", failure: "normal" };
const TYPE_LABEL: Record<SetType, string> = { warmup: "W", drop: "D", failure: "F", normal: "" };

function beep() {
  try {
    const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new Ctx();
    [0, 0.25].forEach((t) => {
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.frequency.value = 880; o.connect(g); g.connect(ctx.destination);
      g.gain.setValueAtTime(0.2, ctx.currentTime + t); g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + t + 0.2);
      o.start(ctx.currentTime + t); o.stop(ctx.currentTime + t + 0.2);
    });
  } catch {}
}

export default function Logger() {
  const [w, setW] = useState<ActiveWorkout | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [stats, setStats] = useState<Record<string, ExerciseStats>>({});
  const [now, setNow] = useState(Date.now());
  const [picker, setPicker] = useState<null | { mode: "add" } | { mode: "swap"; index: number }>(null);
  const [menu, setMenu] = useState<number | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");
  const rang = useRef<number | null>(null);

  useEffect(() => { setW(loadActive()); setLoaded(true); }, []);
  const update = useCallback((fn: (w: ActiveWorkout) => ActiveWorkout) => {
    setW((cur) => { if (!cur) return cur; const next = fn(cur); saveActive(next); return next; });
  }, []);

  // Previous performance for each exercise
  const ids = w?.exercises.map((e) => e.exerciseId).join(",") ?? "";
  useEffect(() => {
    if (!ids) return;
    api<{ stats: Record<string, ExerciseStats> }>(`/api/exercises/stats?ids=${ids}`).then((r) => setStats((s) => ({ ...s, ...r.stats })), () => {});
  }, [ids]);

  // Clock + rest timer (timer stored as an end time, so it survives the phone sleeping)
  useEffect(() => { const t = setInterval(() => setNow(Date.now()), 500); return () => clearInterval(t); }, []);
  useEffect(() => {
    if (w?.restEndsAt && now >= w.restEndsAt && rang.current !== w.restEndsAt) { rang.current = w.restEndsAt; beep(); }
  }, [now, w?.restEndsAt]);

  // Keep the screen awake during a workout
  useEffect(() => {
    let lock: { release: () => Promise<void> } | null = null;
    const nav = navigator as Navigator & { wakeLock?: { request: (t: "screen") => Promise<{ release: () => Promise<void> }> } };
    const get = () => nav.wakeLock?.request("screen").then((l) => (lock = l)).catch(() => {});
    if (w) get();
    const vis = () => document.visibilityState === "visible" && w && get();
    document.addEventListener("visibilitychange", vis);
    return () => { document.removeEventListener("visibilitychange", vis); lock?.release().catch(() => {}); };
  }, [!!w]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!loaded) return <main><p className="muted"><span className="spinner" />Loading…</p></main>;
  if (!w) return (
    <main>
      <h1>No workout in progress</h1>
      <p className="muted">Start one from Today or Routines.</p>
      <div className="row"><Link href="/today">Today</Link> · <Link href="/routines">Routines</Link></div>
    </main>
  );

  const setField = (ei: number, si: number, patch: Partial<LoggedSet>) =>
    update((x) => ({ ...x, exercises: x.exercises.map((e, i) => i !== ei ? e : { ...e, sets: e.sets.map((s, j) => j !== si ? s : { ...s, ...patch }) }) }));

  const toggleDone = (ei: number, si: number) => {
    const ex = w.exercises[ei];
    const s = ex.sets[si];
    const done = !s.done;
    const e = getExercise(ex.exerciseId)!;
    // Fill blanks from previous / target when ticking, like Hevy
    const prev = stats[ex.exerciseId]?.last?.sets.filter((x) => x.type !== "warmup")[si] ?? stats[ex.exerciseId]?.last?.sets[0];
    const patch: Partial<LoggedSet> = { done };
    if (done) {
      for (const c of columns(e.kind)) {
        if (s[c.key] == null) {
          const fallback = (prev?.[c.key] as number | undefined) ?? (c.key === "reps" ? ex.target?.repsMax ?? ex.target?.repsMin ?? undefined : undefined);
          if (fallback != null) (patch as Record<string, unknown>)[c.key] = fallback;
        }
      }
    }
    update((x) => {
      const exercises = x.exercises.map((e2, i) => i !== ei ? e2 : { ...e2, sets: e2.sets.map((s2, j) => j !== si ? s2 : { ...s2, ...patch }) });
      // Supersets: rest only after the last exercise in the group
      const group = ex.superset;
      const nextInGroup = group ? exercises.findIndex((e2, i) => i > ei && e2.superset === group) : -1;
      const rest = done && ex.restSec > 0 && nextInGroup < 0;
      return { ...x, exercises, restEndsAt: rest ? Date.now() + ex.restSec * 1000 : x.restEndsAt, restTotal: rest ? ex.restSec : x.restTotal };
    });
  };

  const addSet = (ei: number) => update((x) => ({
    ...x, exercises: x.exercises.map((e, i) => {
      if (i !== ei) return e;
      const last = e.sets[e.sets.length - 1];
      return { ...e, sets: [...e.sets, { ...last, type: "normal", done: false, rpe: undefined }] };
    }),
  }));
  const removeSet = (ei: number, si: number) => update((x) => ({ ...x, exercises: x.exercises.map((e, i) => i !== ei ? e : { ...e, sets: e.sets.filter((_, j) => j !== si) }) }));
  const move = (ei: number, d: -1 | 1) => update((x) => {
    const a = [...x.exercises]; const j = ei + d; if (j < 0 || j >= a.length) return x; [a[ei], a[j]] = [a[j], a[ei]]; return { ...x, exercises: a };
  });

  const elapsed = (now - Date.parse(w.startedAt)) / 1000;
  const doneSets = w.exercises.flatMap((e) => e.sets).filter((s) => s.done && s.type !== "warmup");
  const volume = doneSets.reduce((a, s) => a + (s.weight ?? 0) * (s.reps ?? 0), 0);
  const restLeft = w.restEndsAt ? (w.restEndsAt - now) / 1000 : 0;

  async function finish() {
    if (!w) return;
    const open = w.exercises.flatMap((e) => e.sets).filter((s) => !s.done).length;
    if (!doneSets.length) return setErr("Tick off at least one set first — or discard the workout.");
    if (open && !confirm(`${open} set${open > 1 ? "s are" : " is"} not ticked off. Finish anyway? Unticked sets won't be saved.`)) return;
    setSaving(true); setErr("");
    try {
      const body: Partial<Workout> = {
        id: w.id, date: w.date, name: w.name, routineKey: w.routineKey, startedAt: w.startedAt, endedAt: new Date().toISOString(),
        notes: w.notes,
        exercises: w.exercises.map(({ target: _t, hint: _h, ...e }) => ({ ...e, sets: e.sets.filter((s) => s.done) })).filter((e) => e.sets.length),
      };
      const r = await api<{ workout: Workout }>("/api/workouts", { body });
      saveActive(null);
      window.location.href = `/history/${r.workout.id}?done=1`;
    } catch (e) {
      setErr((e as Error).message); setSaving(false);
    }
  }

  function discard() {
    if (!confirm("Discard this workout? Nothing will be saved.")) return;
    saveActive(null);
    window.location.href = "/today";
  }

  return (
    <main className="logger">
      <div className="logger-head">
        <div>
          <input className="title-input" value={w.name} onChange={(e) => update((x) => ({ ...x, name: e.target.value }))} aria-label="Workout name" />
          <div className="row small muted" style={{ gap: 14 }}>
            <span className="display">{fmtClock(elapsed)}</span><span>{doneSets.length} set{doneSets.length === 1 ? "" : "s"}</span>{volume > 0 && <span>{volume.toLocaleString()} lb</span>}
          </div>
        </div>
        <button className="primary" onClick={finish} disabled={saving}>{saving ? "Saving…" : "Finish"}</button>
      </div>
      {err && <p className="error">{err}</p>}

      {w.exercises.map((ex, ei) => <ExerciseCard key={`${ex.exerciseId}-${ei}`} ex={ex} ei={ei} stats={stats[ex.exerciseId]}
        menuOpen={menu === ei} setMenu={(o) => setMenu(o ? ei : null)}
        onField={setField} onToggle={toggleDone} onAddSet={addSet} onRemoveSet={removeSet}
        onNotes={(v) => update((x) => ({ ...x, exercises: x.exercises.map((e, i) => i === ei ? { ...e, notes: v } : e) }))}
        onRest={(v) => update((x) => ({ ...x, exercises: x.exercises.map((e, i) => i === ei ? { ...e, restSec: v } : e) }))}
        onSuperset={(v) => update((x) => ({ ...x, exercises: x.exercises.map((e, i) => i === ei ? { ...e, superset: v } : e) }))}
        onMove={(d) => move(ei, d)} onSwap={() => setPicker({ mode: "swap", index: ei })}
        onRemove={() => update((x) => ({ ...x, exercises: x.exercises.filter((_, i) => i !== ei) }))}
        onInfo={() => setInfo(ex.exerciseId)}
      />)}
      {info && <ExerciseSheet id={info} onClose={() => setInfo(null)} />}

      <button className="wide" onClick={() => setPicker({ mode: "add" })}>+ Add exercise</button>
      <textarea rows={2} placeholder="Workout notes" value={w.notes} onChange={(e) => update((x) => ({ ...x, notes: e.target.value }))} style={{ marginTop: 12 }} />
      <button className="wide danger-text" onClick={discard} style={{ marginTop: 12 }}>Discard workout</button>

      {w.restEndsAt && restLeft > -3 && (
        <div className={`rest-bar ${restLeft <= 0 ? "done" : ""}`}>
          <div className="rest-fill" style={{ width: `${Math.max(0, Math.min(100, (restLeft / (w.restTotal || 1)) * 100))}%` }} />
          <button onClick={() => update((x) => ({ ...x, restEndsAt: (x.restEndsAt ?? Date.now()) - 15000 }))}>−15</button>
          <b>{restLeft > 0 ? `Rest ${fmtClock(restLeft)}` : "Rest done — go!"}</b>
          <button onClick={() => update((x) => ({ ...x, restEndsAt: (x.restEndsAt ?? Date.now()) + 15000, restTotal: x.restTotal + 15 }))}>+15</button>
          <button onClick={() => update((x) => ({ ...x, restEndsAt: null }))}>Skip</button>
        </div>
      )}

      {picker && <ExercisePicker title={picker.mode === "swap" ? "Swap exercise" : "Add exercise"} onClose={() => setPicker(null)} onPick={(e) => {
        const fresh = buildExercise({ exerciseId: e.id, sets: 3, warmupSets: 0, repsMin: e.kind === "weight_reps" || e.kind === "reps" ? 8 : null, repsMax: e.kind === "weight_reps" || e.kind === "reps" ? 12 : null, seconds: e.kind === "duration" ? 30 : null, minutes: e.kind === "cardio" ? 20 : null, count: e.kind === "swings" || e.kind === "throws" ? 10 : null, weightLb: null, targetRpe: null, tempo: null, restSec: 90, superset: null, notes: null }, stats[e.id]);
        update((x) => picker.mode === "swap"
          ? { ...x, exercises: x.exercises.map((ex, i) => i === picker.index ? { ...fresh, sets: fresh.sets.slice(0, Math.max(1, ex.sets.length)) } : ex) }
          : { ...x, exercises: [...x.exercises, fresh] });
        setPicker(null);
      }} />}
    </main>
  );
}

function ExerciseCard(props: {
  ex: ActiveExercise; ei: number; stats?: ExerciseStats; menuOpen: boolean; setMenu: (o: boolean) => void;
  onField: (ei: number, si: number, p: Partial<LoggedSet>) => void; onToggle: (ei: number, si: number) => void;
  onAddSet: (ei: number) => void; onRemoveSet: (ei: number, si: number) => void; onNotes: (v: string) => void;
  onRest: (v: number) => void; onSuperset: (v: string | null) => void; onMove: (d: -1 | 1) => void; onSwap: () => void; onRemove: () => void;
  onInfo: () => void;
}) {
  const { ex, ei, stats } = props;
  const e = getExercise(ex.exerciseId)!;
  const cols = columns(e.kind);
  const prevSets = stats?.last?.sets ?? [];
  const prevWorking = prevSets.filter((s) => s.type !== "warmup");
  const prevWarm = prevSets.filter((s) => s.type === "warmup");
  let wi = 0, ni = 0;
  return (
    <section className={`card ex-card ${ex.superset ? "superset" : ""}`}>
      <div className="row between">
        <div>
          {ex.superset && <span className="pill green" style={{ marginRight: 6 }}>Superset {ex.superset}</span>}
          <button className="ex-name link" onClick={() => props.onInfo()} aria-label={`${e.name}: how-to and demo`}>{e.name} <span className="small" style={{ fontWeight: 600 }}>ⓘ</span></button>
          <div className="rx" style={{ marginTop: 4 }}>
            {targetLabel(e.kind, ex.target) && <span>{targetLabel(e.kind, ex.target)}</span>}
            {ex.target?.weightLb ? <span className="w">Start {ex.target.weightLb} lb</span> : null}
            {ex.target?.targetRpe ? <span>RPE {ex.target.targetRpe}</span> : null}
            {ex.target?.tempo ? <span>Tempo {ex.target.tempo}</span> : null}
            <span>Rest {fmtClock(ex.restSec)}</span>
          </div>
        </div>
        <button className="link" aria-label="Exercise options" onClick={() => props.setMenu(!props.menuOpen)}>•••</button>
      </div>
      {props.menuOpen && (
        <div className="ex-menu">
          <button onClick={() => { props.onMove(-1); props.setMenu(false); }}>Move up</button>
          <button onClick={() => { props.onMove(1); props.setMenu(false); }}>Move down</button>
          <button onClick={() => { props.onSwap(); props.setMenu(false); }}>Swap exercise</button>
          <button onClick={() => { props.onSuperset(ex.superset ? null : "A"); props.setMenu(false); }}>{ex.superset ? "Remove superset" : "Superset with neighbors (A)"}</button>
          <label className="small">Rest
            <select value={ex.restSec} onChange={(ev) => props.onRest(Number(ev.target.value))}>
              {[0, 30, 45, 60, 90, 120, 150, 180, 240].map((s) => <option key={s} value={s}>{s ? fmtClock(s) : "Off"}</option>)}
            </select>
          </label>
          <button className="danger-text" onClick={() => { props.onRemove(); props.setMenu(false); }}>Remove exercise</button>
        </div>
      )}
      {ex.hint && <p className="small hint">{ex.hint}</p>}
      <p className="small muted cue">{ex.target?.notes || e.cue}</p>
      <input className="note-input" placeholder="Add a note" value={ex.notes} onChange={(ev) => props.onNotes(ev.target.value)} />
      <table className="sets">
        <thead><tr><th>SET</th><th>PREVIOUS</th>{cols.map((c) => <th key={c.key}>{c.label}</th>)}<th>✓</th></tr></thead>
        <tbody>
          {ex.sets.map((s, si) => {
            const isWarm = s.type === "warmup";
            const label = isWarm ? "W" : s.type === "normal" ? String(++ni) : TYPE_LABEL[s.type];
            const prev = isWarm ? prevWarm[wi++] : prevWorking[ni - 1];
            return (
              <tr key={si} className={s.done ? "done" : ""}>
                <td><button className={`set-type ${s.type}`} title="Tap to change set type" onClick={() => props.onField(ei, si, { type: NEXT_TYPE[s.type] })}
                  onContextMenu={(ev) => { ev.preventDefault(); if (confirm("Delete this set?")) props.onRemoveSet(ei, si); }}>{label}</button></td>
                <td className="prev small muted">{prev ? formatSet(e.kind, prev) : "—"}</td>
                {cols.map((c) => (
                  <td key={c.key}>
                    <input inputMode="decimal" className="cell"
                      placeholder={c.key === "reps" ? String(ex.target?.repsMax ?? ex.target?.repsMin ?? (prev?.reps ?? "")) : prev?.[c.key] != null ? String(prev[c.key]) : ""}
                      value={s[c.key] == null ? "" : String(s[c.key])}
                      onChange={(ev) => props.onField(ei, si, { [c.key]: ev.target.value === "" ? undefined : Number(ev.target.value) })} />
                  </td>
                ))}
                <td><button className={`tick ${s.done ? "on" : ""}`} aria-label={s.done ? "Undo set" : "Complete set"} onClick={() => props.onToggle(ei, si)}>✓</button></td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <div className="row between">
        <button className="link" onClick={() => props.onAddSet(ei)}>+ Add set</button>
        {ex.sets.length > 1 && <button className="link small muted" onClick={() => props.onRemoveSet(ei, ex.sets.length - 1)}>Remove last set</button>}
      </div>
    </section>
  );
}
