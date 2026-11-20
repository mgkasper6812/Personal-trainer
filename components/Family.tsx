"use client";
import { useCallback, useEffect, useState } from "react";
import { api, localDate } from "@/lib/client";
import type { Alert, PublicUser, WorkoutSummary } from "@/lib/types";

type Member = PublicUser & { hasProfile: boolean; hasProgram: boolean; programTitle: string | null; status: "green" | "yellow" | "red" | null; checkedIn: boolean; workoutsThisWeek: number; recent: WorkoutSummary[] };
type Res = { me: PublicUser; members: Member[]; alerts: Alert[]; usage: { month: string; usd: number; calls: number } };

export default function Family() {
  const [r, setR] = useState<Res | null>(null);
  const [err, setErr] = useState("");
  const [f, setF] = useState({ name: "", username: "", password: "" });
  const [adding, setAdding] = useState(false);
  const load = useCallback(() => api<Res>(`/api/family?date=${localDate()}`).then(setR, (e) => setErr(e.message)), []);
  useEffect(() => { load(); }, [load]);

  async function add(e: React.FormEvent) {
    e.preventDefault(); setErr("");
    try { await api("/api/members", { body: { ...f, role: "athlete" } }); setF({ name: "", username: "", password: "" }); setAdding(false); load(); }
    catch (e) { setErr((e as Error).message); }
  }
  if (!r) return <main>{err ? <p className="error">{err}</p> : <p className="muted"><span className="spinner" />Loading…</p>}</main>;
  const unseen = r.alerts.filter((a) => !a.seen);
  const label = { green: "Ready", yellow: "Adjusted", red: "Recovery" } as const;

  return (
    <main>
      <h1>Family</h1>
      {unseen.length > 0 && (
        <div className="card urgent">
          <h2>Alerts</h2>
          {unseen.map((a) => <p key={a.id} className="small"><span className={`pill ${a.level === "urgent" ? "red" : "yellow"}`}>{a.level === "urgent" ? "Urgent" : "Heads up"}</span> <b>{a.date}:</b> {a.message}</p>)}
          <button className="link" onClick={async () => { await api("/api/family", { body: {} }); load(); }}>Mark as seen</button>
        </div>
      )}
      {r.members.map((m) => (
        <div className="card" key={m.id}>
          <div className="row between">
            <h2 style={{ margin: 0 }}>{m.name}{m.id === r.me.id ? " (you)" : ""}</h2>
            {m.status ? <span className={`pill ${m.status}`}>{label[m.status]}</span> : <span className="small muted">{m.checkedIn ? "" : "No check-in today"}</span>}
          </div>
          {!m.hasProgram ? (
            <p className="muted small">{m.id === r.me.id ? "Setup not finished." : `Waiting for ${m.name} to sign in and finish setup (@${m.username}).`}</p>
          ) : (<>
            <p className="small muted">{m.programTitle} · {m.workoutsThisWeek} workout{m.workoutsThisWeek === 1 ? "" : "s"} in the last 7 days</p>
            {m.recent.map((w) => <p key={w.id} className="small" style={{ margin: "4px 0" }}>✓ {w.name} <span className="muted">· {w.date}{w.prs ? ` · 🏆 ${w.prs}` : ""}</span></p>)}
          </>)}
          {m.id !== r.me.id && m.hasProgram && (
            <div className="row" style={{ marginTop: 8, gap: 16 }}>
              <a href={`/today?user=${m.id}`}>Today</a><a href={`/history?user=${m.id}`}>History</a><a href={`/routines?user=${m.id}`}>Program</a>
            </div>
          )}
        </div>
      ))}
      {adding ? (
        <form className="card" onSubmit={add} style={{ display: "grid", gap: 12 }}>
          <h2>Add a family member</h2>
          <label>First name<input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} required /></label>
          <label>Username<input value={f.username} onChange={(e) => setF({ ...f, username: e.target.value })} autoCapitalize="none" required /></label>
          <label>Starting password<input value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} required minLength={6} /></label>
          {err && <p className="error">{err}</p>}
          <div className="row"><button className="primary">Create login</button><button type="button" onClick={() => setAdding(false)}>Cancel</button></div>
        </form>
      ) : <button className="wide" onClick={() => setAdding(true)} style={{ marginBottom: 14 }}>+ Add a family member</button>}
      <div className="card">
        <h2>Coach usage · {r.usage.month}</h2>
        <div className="stats"><div className="stat"><b>${r.usage.usd.toFixed(2)}</b>Claude API</div><div className="stat"><b>{r.usage.calls}</b>coach calls</div></div>
        <p className="small muted">Estimated from token counts. Most of the app runs without the AI; it&apos;s used to build programs.</p>
      </div>
    </main>
  );
}
