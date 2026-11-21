"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { api } from "@/lib/client";
import { getExercise } from "@/lib/exercises";
import type { Workout } from "@/lib/types";
import { fmtClock, formatSet } from "@/lib/workout-client";
import { IconTrophy, IconWatch } from "./icons";

export const SHORTCUT_NAME = "Trainer Watch Sync";

export default function WorkoutDetail({ id, viewUser, justFinished }: { id: string; viewUser: string | null; justFinished: boolean }) {
  const [r, setR] = useState<{ workout: Workout; self: boolean } | null>(null);
  const [err, setErr] = useState("");
  useEffect(() => { api<{ workout: Workout; self: boolean }>(`/api/workouts/${id}${viewUser ? `?user=${viewUser}` : ""}`).then(setR, (e) => setErr(e.message)); }, [id, viewUser]);
  if (!r) return <main>{err ? <p className="error">{err}</p> : <p className="muted"><span className="spinner" />Loading…</p>}</main>;
  const w = r.workout;
  const dur = (Date.parse(w.endedAt) - Date.parse(w.startedAt)) / 1000;

  function syncWatch() {
    const input = JSON.stringify({ id: w.id, start: w.startedAt, end: w.endedAt });
    const back = window.location.href.replace("?done=1", "");
    window.location.href = `shortcuts://x-callback-url/run-shortcut?name=${encodeURIComponent(SHORTCUT_NAME)}&input=text&text=${encodeURIComponent(input)}&x-success=${encodeURIComponent(back)}`;
  }
  async function del() {
    if (!confirm("Delete this workout?")) return;
    await api(`/api/workouts/${w.id}`, { method: "DELETE" });
    window.location.href = "/history";
  }

  return (
    <main>
      {justFinished && <div className="card done-banner"><h2>Workout complete</h2><p className="small">{w.stats.prs.length ? `${w.stats.prs.length} new record${w.stats.prs.length > 1 ? "s" : ""}!` : "Logged. Consistency wins."}</p></div>}
      <h1 style={{ marginBottom: 2 }}>{w.name}</h1>
      <p className="small muted" style={{ marginTop: 0 }}>{new Date(w.startedAt).toLocaleString(undefined, { weekday: "long", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}</p>
      <div className="stats">
        <div className="stat"><b>{fmtClock(dur)}</b>time</div>
        <div className="stat"><b>{w.stats.sets}</b>sets</div>
        {w.stats.volume > 0 && <div className="stat"><b>{w.stats.volume.toLocaleString()}</b>lb volume</div>}
      </div>

      <div className="card" style={{ marginTop: 14 }}>
        <h2 className="row" style={{ gap: 8 }}><IconWatch size={20} />Apple Watch</h2>
        {w.watch ? (
          <div className="stats">
            {w.watch.avgHR && <div className="stat"><b>{w.watch.avgHR}</b>avg bpm</div>}
            {w.watch.maxHR && <div className="stat"><b>{w.watch.maxHR}</b>max bpm</div>}
            {w.watch.calories && <div className="stat"><b>{Math.round(w.watch.calories)}</b>active kcal</div>}
          </div>
        ) : r.self ? (<>
          <p className="small muted">Recorded this on your Watch? Pull heart rate and calories from Apple Health.</p>
          <button className="primary wide" onClick={syncWatch}>Add Watch data</button>
          <p className="small muted">First time? <Link href="/settings#watch">Set up the Shortcut</Link> (2 minutes).</p>
        </>) : <p className="small muted">No Watch data.</p>}
      </div>

      {w.stats.prs.length > 0 && (
        <div className="card">
          <h2 className="row" style={{ gap: 8 }}><IconTrophy size={20} />New records</h2>
          {w.stats.prs.map((p, i) => <p key={i} className="small"><b>{getExercise(p.exerciseId)?.name}</b> — {p.label}: {p.value} {p.unit}</p>)}
        </div>
      )}

      {w.exercises.map((ex, i) => {
        const e = getExercise(ex.exerciseId);
        if (!e) return null;
        return (
          <div className="card" key={i}>
            <Link href={`/exercise/${e.id}${viewUser ? `?user=${viewUser}` : ""}`} className="ex-name">{e.name}</Link>
            {ex.notes && <p className="small muted">{ex.notes}</p>}
            {ex.sets.map((s, j) => (
              <p key={j} className="small" style={{ margin: "4px 0" }}>
                <b style={{ display: "inline-block", width: 28, color: s.type === "warmup" ? "var(--yellow)" : undefined }}>{s.type === "warmup" ? "W" : s.type === "drop" ? "D" : s.type === "failure" ? "F" : j + 1}</b>
                {formatSet(e.kind, s)}{s.rpe ? ` @ RPE ${s.rpe}` : ""}
              </p>
            ))}
          </div>
        );
      })}
      {w.notes && <p className="small muted">{w.notes}</p>}
      {r.self && <button className="wide danger-text" onClick={del}>Delete workout</button>}
    </main>
  );
}
