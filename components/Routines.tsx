"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { api, localDate } from "@/lib/client";
import type { ProgramRecord } from "@/lib/data";
import { getExercise } from "@/lib/exercises";
import { loadActive, startWorkout } from "@/lib/workout-client";

const DAY = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function Routines({ viewUser }: { viewUser: string | null }) {
  const [r, setR] = useState<{ name: string; self: boolean; record: ProgramRecord | null } | null>(null);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const [active, setActive] = useState<string | null>(null);

  useEffect(() => {
    setActive(loadActive()?.name ?? null);
    api<{ name: string; self: boolean; record: ProgramRecord | null }>(`/api/program${viewUser ? `?user=${viewUser}` : ""}`).then(setR, (e) => setErr(e.message));
  }, [viewUser]);

  async function changeStart(startDate: string) {
    if (!startDate) return;
    try { const x = await api<{ record: ProgramRecord }>("/api/program", { method: "PATCH", body: { startDate } }); setR((c) => (c ? { ...c, record: x.record } : c)); }
    catch (e) { setErr((e as Error).message); }
  }

  async function regenerate() {
    if (!confirm("Ask the coach to build a fresh program from your profile? Your current routines will be replaced (history is kept).")) return;
    setBusy(true); setErr("");
    try { const x = await api<{ record: ProgramRecord }>("/api/program", { body: { date: localDate(), startDate: r?.record?.startDate } }); setR((c) => (c ? { ...c, record: x.record } : c)); }
    catch (e) { setErr((e as Error).message); }
    setBusy(false);
  }

  if (err && !r) return <main><p className="error">{err}</p></main>;
  if (!r) return <main><p className="muted"><span className="spinner" />Loading…</p></main>;
  const p = r.record?.program;
  return (
    <main>
      <h1>{viewUser ? `${r.name}'s routines` : "Workout"}</h1>
      {r.self && active && <Link href="/workout" className="resume">▶ Resume “{active}”</Link>}
      {r.self && <button className="wide" onClick={() => startWorkout(null, localDate())} style={{ marginBottom: 14 }}>+ Start empty workout</button>}
      {!p ? <p className="muted">No program yet.</p> : (<>
        <div className="card">
          <h2>{p.title}</h2>
          <p className="small">{p.summary}</p>
          <div className="row between small" style={{ flexWrap: "nowrap" }}>
            <span>Starts</span>
            {r.self ? <input type="date" value={r.record!.startDate} onChange={(e) => changeStart(e.target.value)} style={{ maxWidth: 180 }} aria-label="Program start date" />
              : <b>{r.record!.startDate}</b>}
          </div>
          <div className="week-grid">
            {[1, 2, 3, 4, 5, 6, 0].map((d) => {
              const s = p.schedule.find((x) => x.dayOfWeek === d);
              const rt = s?.routineKey ? p.routines.find((x) => x.key === s.routineKey) : null;
              return <div key={d} className={rt ? "on" : ""}><b>{DAY[d]}</b><span>{rt?.name ?? s?.note ?? "Rest"}</span></div>;
            })}
          </div>
          {p.emphasis.map((e) => (
            <div key={e.area} style={{ marginTop: 8 }}>
              <div className="row between small"><span>{e.area}</span><span>{e.percent}%</span></div>
              <div className="progress"><div style={{ width: `${e.percent}%` }} /></div>
            </div>
          ))}
        </div>

        <h2 style={{ marginTop: 18 }}>My routines</h2>
        {p.routines.map((rt) => (
          <div className="card" key={rt.key}>
            <div className="row between">
              <h2 style={{ margin: 0 }}>{rt.name}</h2>
              {r.self && <Link href={`/routines/${rt.key}`} className="small">Edit</Link>}
            </div>
            <p className="small muted" style={{ margin: "4px 0 8px" }}>{rt.purpose} · ~{rt.estMinutes} min</p>
            <p className="small">{rt.exercises.map((e) => `${getExercise(e.exerciseId)?.name}`).join(", ")}</p>
            {r.self && <button className="primary wide" onClick={() => startWorkout(rt, localDate())}>Start routine</button>}
          </div>
        ))}

        {(p.nutrition || p.fueling) && (
          <div className="card">
            <h2>{p.nutrition ? "Nutrition" : "Fueling"}</h2>
            {p.nutrition && (<>
              <div className="stats"><div className="stat"><b>{p.nutrition.calories.toLocaleString()}</b>calories</div><div className="stat"><b>{p.nutrition.proteinG}g</b>protein</div></div>
              <p className="small">{p.nutrition.carbApproach}</p>
              <p className="warn small"><b>Evenings:</b> {p.nutrition.eveningPlan}</p>
            </>)}
            {p.fueling && <p className="small">{p.fueling}</p>}
          </div>
        )}
        <div className="card">
          <h2>Week by week</h2>
          {p.weeks.map((w) => <p key={w.week} className="small"><b>Week {w.week}{w.deload ? " (lighter)" : ""}:</b> {w.theme} — {w.progression}</p>)}
          <h3>Rules</h3>
          <ul className="small">{p.rules.map((x) => <li key={x}>{x}</li>)}</ul>
        </div>
        {r.self && (
          <p style={{ textAlign: "center" }}>
            <button className="link" onClick={regenerate} disabled={busy}>{busy ? <><span className="spinner" />Building a new program…</> : "Rebuild program with the coach"}</button>
            {" · "}<Link href="/onboarding" className="small">Edit my setup answers</Link>
          </p>
        )}
        {err && <p className="error">{err}</p>}
      </>)}
    </main>
  );
}
