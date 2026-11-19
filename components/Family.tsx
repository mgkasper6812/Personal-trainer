"use client";
import { useCallback, useEffect, useState } from "react";
import { api, localDate } from "@/lib/client";
import type { Alert, PublicUser } from "@/lib/types";

type Member = PublicUser & { hasProgram: boolean; programTitle: string | null; today: { done: number; total: number; readiness: string; headline: string } | null };
type Res = { me: PublicUser; members: Member[]; alerts: Alert[]; usage: { month: string; usd: number; calls: number } };

export default function Family() {
  const [r, setR] = useState<Res | null>(null);
  const [err, setErr] = useState("");
  const [f, setF] = useState({ name: "", username: "", password: "" });
  const [adding, setAdding] = useState(false);

  const load = useCallback(() => api<Res>(`/api/family?date=${localDate()}`).then(setR, (e) => setErr(e.message)), []);
  useEffect(() => { load(); }, [load]);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    setErr("");
    try {
      await api("/api/members", { body: { ...f, role: "athlete" } });
      setF({ name: "", username: "", password: "" });
      setAdding(false);
      load();
    } catch (e) {
      setErr((e as Error).message);
    }
  }

  async function logout() {
    await api("/api/logout", { body: {} });
    window.location.href = "/login";
  }

  if (!r) return <main>{err ? <p className="error">{err}</p> : <p className="muted"><span className="spinner" />Loading…</p>}</main>;
  const unseen = r.alerts.filter((a) => !a.seen);

  return (
    <main>
      <h1>Family</h1>
      {unseen.length > 0 && (
        <div className="card" style={{ borderColor: "var(--red)" }}>
          <h2>Alerts</h2>
          {unseen.map((a) => <p key={a.id} className="warn small"><b>{a.date}:</b> {a.message}</p>)}
          <button className="link" onClick={async () => { await api("/api/family", { body: {} }); load(); }}>Mark as seen</button>
        </div>
      )}

      {r.members.map((m) => (
        <div className="card" key={m.id}>
          <div className="row between">
            <h2 style={{ margin: 0 }}>{m.name}{m.id === r.me.id ? " (you)" : ""}</h2>
            <span className="small muted">@{m.username}</span>
          </div>
          {!m.hasProgram ? (
            <p className="muted small">{m.id === r.me.id ? "Setup not finished." : `Waiting for ${m.name} to sign in and finish the setup chat.`}</p>
          ) : (
            <>
              <p className="small muted">{m.programTitle}</p>
              {m.today ? (
                <>
                  <p className="small"><span className={`pill ${m.today.readiness}`}>{m.today.done}/{m.today.total}</span> {m.today.headline}</p>
                  <div className="progress"><div style={{ width: `${m.today.total ? (m.today.done / m.today.total) * 100 : 0}%` }} /></div>
                </>
              ) : (
                <p className="small muted">No plan built today yet.</p>
              )}
            </>
          )}
          {m.id !== r.me.id && (
            <div className="row" style={{ marginTop: 8, gap: 16 }}>
              <a href={`/today?user=${m.id}`}>Today</a>
              <a href={`/program?user=${m.id}`}>Program</a>
              <a href={`/onboarding?user=${m.id}`}>Setup chat</a>
            </div>
          )}
        </div>
      ))}

      {adding ? (
        <form className="card" onSubmit={add} style={{ display: "grid", gap: 12 }}>
          <h2>Add Maicie (or another athlete)</h2>
          <label>First name<input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} required /></label>
          <label>Username<input value={f.username} onChange={(e) => setF({ ...f, username: e.target.value })} autoCapitalize="none" required /></label>
          <label>Starting password (she can share it with you only)<input value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} required minLength={6} /></label>
          {err && <p className="error">{err}</p>}
          <div className="row"><button className="primary">Create login</button><button type="button" onClick={() => setAdding(false)}>Cancel</button></div>
        </form>
      ) : (
        <button onClick={() => setAdding(true)} style={{ width: "100%", marginBottom: 14 }}>+ Add a family member</button>
      )}

      <div className="card">
        <h2>Coach usage · {r.usage.month}</h2>
        <div className="stats">
          <div className="stat"><b>${r.usage.usd.toFixed(2)}</b>Claude API cost</div>
          <div className="stat"><b>{r.usage.calls}</b>coach calls</div>
        </div>
        <p className="small muted">Estimated from token counts. Your Anthropic console shows the exact bill.</p>
      </div>

      <button className="link" onClick={logout}>Sign out</button>
    </main>
  );
}
