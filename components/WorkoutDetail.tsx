"use client";
import HeartRateShots, { WatchStats, type Watch } from "./HeartRateShots";
import Link from "next/link";
import BackButton from "./BackButton";
import { useEffect, useState } from "react";
import { api } from "@/lib/client";
import { getExercise } from "@/lib/exercises";
import type { Workout } from "@/lib/types";
import { fmtClock, formatSet } from "@/lib/workout-client";
import { NumberInput } from "./ui";
import { IconTrophy, IconWatch } from "./icons";

export const SHORTCUT_NAME = "Trainer Watch Sync";

export default function WorkoutDetail({ id, viewUser, justFinished }: { id: string; viewUser: string | null; justFinished: boolean }) {
  const [r, setR] = useState<{ workout: Workout; self: boolean } | null>(null);
  const [err, setErr] = useState("");
  const [editTime, setEditTime] = useState<{ start: string; minutes: number | null } | null>(null);
  const [fb, setFb] = useState<{ message: string; replies: string[] } | null | "loading">(null);
  useEffect(() => {
    if (viewUser) return;
    setFb("loading");
    api<{ note: { message: string; replies: string[] } }>(`/api/workouts/${id}/feedback`).then((x) => setFb(x.note), () => setFb(null));
  }, [id, viewUser]);
  useEffect(() => { api<{ workout: Workout; self: boolean }>(`/api/workouts/${id}${viewUser ? `?user=${viewUser}` : ""}`).then(setR, (e) => setErr(e.message)); }, [id, viewUser]);
  if (!r) return <main>{err ? <p className="error">{err}</p> : <p className="muted"><span className="spinner" />Loading…</p>}</main>;
  const w = r.workout;
  const dur = (Date.parse(w.endedAt) - Date.parse(w.startedAt)) / 1000;

  function syncWatch() {
    const input = JSON.stringify({ id: w.id, start: w.startedAt, end: w.endedAt });
    const back = window.location.href.replace("?done=1", "");
    window.location.href = `shortcuts://x-callback-url/run-shortcut?name=${encodeURIComponent(SHORTCUT_NAME)}&input=text&text=${encodeURIComponent(input)}&x-success=${encodeURIComponent(back)}`;
  }
  async function saveWatch(v: Watch | undefined) {
    const x = await api<{ workout: Workout }>(`/api/workouts/${w.id}`, { method: "PATCH", body: { watch: v ?? null } });
    setR({ ...r!, workout: x.workout });
  }
  async function saveTime() {
    if (!editTime?.minutes) return;
    const day = w.date;
    const start = new Date(`${day}T${editTime.start}:00`);
    try {
      const x = await api<{ workout: Workout }>(`/api/workouts/${w.id}`, { method: "PATCH", body: { startedAt: start.toISOString(), endedAt: new Date(start.getTime() + editTime.minutes * 60000).toISOString() } });
      setR({ ...r!, workout: x.workout }); setEditTime(null);
    } catch (e) { setErr((e as Error).message); }
  }
  async function del() {
    if (!confirm("Delete this workout?")) return;
    await api(`/api/workouts/${w.id}`, { method: "DELETE" });
    window.location.href = "/history";
  }

  return (
    <main>
      <BackButton fallback={viewUser ? `/history?user=${viewUser}` : "/history"} label={justFinished ? "Done" : "Back"} />
      {justFinished && <div className="card done-banner"><h2>Workout complete</h2><p className="small">{w.stats.prs.length ? `${w.stats.prs.length} new record${w.stats.prs.length > 1 ? "s" : ""}!` : "Logged. Consistency wins."}</p></div>}
      <h1 style={{ marginBottom: 2 }}>{w.name}</h1>
      <p className="small muted" style={{ marginTop: 0 }}>{new Date(w.startedAt).toLocaleString(undefined, { weekday: "long", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}</p>
      <div className="stats">
        <div className="stat"><b>{fmtClock(dur)}</b>time{r.self && <button className="link small" style={{ display: "block", margin: "2px auto 0", minHeight: 0, padding: 0 }}
          onClick={() => { const s = new Date(w.startedAt); setEditTime({ start: `${String(s.getHours()).padStart(2, "0")}:${String(s.getMinutes()).padStart(2, "0")}`, minutes: Math.max(1, Math.round(dur / 60)) }); }}>Edit</button>}</div>
        <div className="stat"><b>{w.stats.sets}</b>sets</div>
        {w.stats.volume > 0 && <div className="stat"><b>{w.stats.volume.toLocaleString()}</b>lb volume</div>}
      </div>

      {editTime && (
        <div className="card" style={{ marginTop: 14 }}>
          <span className="eyebrow">Edit time</span>
          <div className="row" style={{ gap: 10, flexWrap: "nowrap", marginTop: 8 }}>
            <label className="small" style={{ flex: 1 }}>Started at<input type="time" value={editTime.start} onChange={(e) => e.target.value && setEditTime({ ...editTime, start: e.target.value })} /></label>
            <label className="small" style={{ flex: 1 }}>Minutes<NumberInput value={editTime.minutes} decimals={0} onChange={(v) => setEditTime({ ...editTime, minutes: v })} /></label>
          </div>
          <div className="row" style={{ gap: 8, marginTop: 10 }}>
            <button className="primary" onClick={saveTime} disabled={!editTime.minutes}>Save time</button>
            <button className="link" onClick={() => setEditTime(null)}>Cancel</button>
          </div>
          <p className="small muted" style={{ margin: "8px 0 0" }}>Or add the Watch / Strava screenshot below — it sets the real length automatically.</p>
        </div>
      )}

      {fb && (
        <div className="card coach-card" style={{ marginTop: 14 }}>
          <span className="eyebrow">Coach</span>
          {fb === "loading" ? <p className="small muted"><span className="spinner" />Your coach is looking at this workout…</p> : (<>
            <p style={{ margin: "8px 0 10px" }}>{fb.message}</p>
            <div className="reply-chips">
              {fb.replies.map((x) => <a key={x} className="chip" href={`/coach?say=${encodeURIComponent(x)}`}>{x}</a>)}
              <a className="chip" href="/coach">Reply</a>
            </div>
          </>)}
        </div>
      )}

      <div className="card" style={{ marginTop: 14 }}>
        <h2 className="row" style={{ gap: 8 }}><IconWatch size={20} />Heart rate &amp; cardio</h2>
        {r.self ? (<>
          <HeartRateShots value={w.watch} label="Add from screenshot" onChange={saveWatch} />
          {!w.watch && (<>
            <p className="small muted" style={{ marginBottom: 6 }}>Or pull it from Apple Health:</p>
            <button className="wide" onClick={syncWatch}>Add Watch data</button>
            <p className="small muted">First time? <Link href="/settings#watch">Set up the Shortcut</Link> (2 minutes).</p>
          </>)}
        </>) : w.watch ? <WatchStats w={w.watch} /> : <p className="small muted">No heart-rate data.</p>}
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
