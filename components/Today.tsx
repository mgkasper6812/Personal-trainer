"use client";
import { useCallback, useEffect, useState } from "react";
import { api, localDate } from "@/lib/client";
import type { PlanRecord } from "@/lib/data";
import type { CheckIn } from "@/lib/types";

type TodayRes = {
  user: { id: string; name: string; role: "parent" | "athlete"; self: boolean };
  date: string;
  weekday: string;
  hasProgram: boolean;
  program: { title: string; blockWeeks: number; week: number; weekInfo: { theme: string; deload: boolean } | null; template: { title: string; minutes: number } | null } | null;
  checkIn: CheckIn | null;
  plan: PlanRecord | null;
};

const shift = (d: string, n: number) => {
  const x = new Date(`${d}T12:00:00`);
  x.setDate(x.getDate() + n);
  return localDate(x);
};

export default function Today({ viewUser }: { viewUser: string | null }) {
  const [date, setDate] = useState(localDate());
  const [data, setData] = useState<TodayRes | null>(null);
  const [err, setErr] = useState("");
  const [building, setBuilding] = useState(false);
  const [editing, setEditing] = useState(false);

  const load = useCallback(async () => {
    setErr("");
    try {
      setData(await api<TodayRes>(`/api/today?date=${date}${viewUser ? `&user=${viewUser}` : ""}`));
    } catch (e) {
      setErr((e as Error).message);
    }
  }, [date, viewUser]);
  useEffect(() => { setData(null); load(); }, [load]);

  async function build() {
    setBuilding(true);
    setErr("");
    try {
      const r = await api<{ plan: PlanRecord }>("/api/plan", { body: { date } });
      setData((d) => (d ? { ...d, plan: r.plan } : d));
    } catch (e) {
      setErr((e as Error).message);
    }
    setBuilding(false);
  }

  async function toggle(key: string, done: boolean) {
    if (!data?.plan) return;
    const prev = data.plan.done;
    const next = done ? [...prev, key] : prev.filter((k) => k !== key);
    setData({ ...data, plan: { ...data.plan, done: next } });
    try {
      await api("/api/plan/toggle", { body: { date, key, done } });
    } catch (e) {
      setErr((e as Error).message);
      setData((d) => (d && d.plan ? { ...d, plan: { ...d.plan, done: prev } } : d));
    }
  }

  const isToday = date === localDate();
  const self = data?.user.self ?? !viewUser;
  const plan = data?.plan?.plan;
  const total = plan ? plan.sections.reduce((a, s) => a + s.items.length, 0) : 0;
  const doneCount = data?.plan?.done.length ?? 0;

  return (
    <main>
      <div className="row between">
        <button className="link" onClick={() => setDate(shift(date, -1))} aria-label="Previous day">‹ Prev</button>
        <div style={{ textAlign: "center" }}>
          <h1 style={{ margin: 0 }}>{data ? (isToday ? "Today" : data.weekday) : "…"}</h1>
          <div className="muted small">{new Date(`${date}T12:00:00`).toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })}</div>
        </div>
        <button className="link" onClick={() => setDate(shift(date, 1))} aria-label="Next day">Next ›</button>
      </div>
      {!isToday && <p className="small" style={{ textAlign: "center" }}><button className="link" onClick={() => setDate(localDate())}>Back to today</button></p>}
      {viewUser && data && <p className="warn small">Viewing {data.user.name}&apos;s day (read-only).</p>}
      {err && <p className="error">{err}</p>}
      {!data && !err && <p className="muted"><span className="spinner" />Loading…</p>}

      {data && !data.hasProgram && (
        <div className="card">
          <h2>{self ? "Let's set you up" : `${data.user.name} hasn't finished setup`}</h2>
          {self && <a href="/onboarding">Start the setup chat →</a>}
        </div>
      )}

      {data?.program && (
        <p className="muted small" style={{ textAlign: "center" }}>
          {data.program.title} · Week {Math.min(data.program.week, data.program.blockWeeks)} of {data.program.blockWeeks}
          {data.program.weekInfo ? ` · ${data.program.weekInfo.theme}` : ""}
          {data.program.week > data.program.blockWeeks ? " · block finished — new block coming" : ""}
        </p>
      )}

      {data?.hasProgram && (
        <>
          {self && (!data.checkIn || editing) ? (
            <CheckInForm
              role={data.user.role}
              date={date}
              initial={data.checkIn}
              onSaved={async (c) => {
                setEditing(false);
                setData((d) => (d ? { ...d, checkIn: c } : d));
                await build();
              }}
            />
          ) : data.checkIn ? (
            <CheckInSummary c={data.checkIn} role={data.user.role} onEdit={self ? () => setEditing(true) : undefined} />
          ) : (
            <p className="muted">No check-in yet.</p>
          )}

          {plan ? (
            <div className="card">
              <div className="row between">
                <span className={`pill ${plan.readiness}`}>{plan.readiness === "green" ? "Go" : plan.readiness === "yellow" ? "Adjusted" : "Recovery"}</span>
                <span className="small muted">{doneCount}/{total} done</span>
              </div>
              <h2 style={{ marginTop: 10 }}>{plan.headline}</h2>
              <div className="progress"><div style={{ width: `${total ? (doneCount / total) * 100 : 0}%` }} /></div>
              <p>{plan.coachNote}</p>
              {plan.sections.map((s, si) => (
                <div key={si}>
                  <h3>{s.title}</h3>
                  <ul className="checklist">
                    {s.items.map((it, ii) => {
                      const key = `${si}.${ii}`;
                      const on = data.plan!.done.includes(key);
                      return (
                        <li key={key}>
                          <label>
                            <input type="checkbox" checked={on} disabled={!self} onChange={(e) => toggle(key, e.target.checked)} />
                            <span>{it.text}{it.detail && <span className="detail">{it.detail}</span>}</span>
                          </label>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ))}
              {plan.meals && (
                <>
                  <h3>Food · {plan.meals.calories.toLocaleString()} cal · {plan.meals.proteinG}g protein</h3>
                  <ul className="checklist">
                    {(["breakfast", "lunch", "dinner", "eveningSnack"] as const).map((m) => (
                      <li key={m}><label style={{ cursor: "default" }}><span><b>{m === "eveningSnack" ? "Evening snack" : m[0].toUpperCase() + m.slice(1)}:</b> {plan.meals![m]}</span></label></li>
                    ))}
                  </ul>
                  <p className="warn small"><b>Tonight:</b> {plan.meals.eveningRule}</p>
                </>
              )}
              {plan.fueling && <p className="small"><b>Fuel:</b> {plan.fueling}</p>}
              {self && (
                <p style={{ marginTop: 12 }}>
                  <button className="link" disabled={building}
                    onClick={() => confirm("Rebuild today's plan? Checkmarks will reset.") && build()}>
                    {building ? <><span className="spinner" />Rebuilding…</> : "Rebuild plan"}
                  </button>
                </p>
              )}
            </div>
          ) : (
            <div className="card">
              <h2>{data.program?.template?.title ?? "Today"}</h2>
              {self ? (
                <>
                  <p className="muted">{data.checkIn ? "Your coach will build today's plan." : "Check in first so your coach can adjust today's plan — or build it now."}</p>
                  <button className="primary" onClick={build} disabled={building}>
                    {building ? <><span className="spinner" />Coach is writing your plan…</> : "Build today's plan"}
                  </button>
                </>
              ) : (
                <p className="muted">No plan built for this day.</p>
              )}
            </div>
          )}
        </>
      )}
    </main>
  );
}

function Scale({ value, onChange, low, high }: { value?: number; onChange: (n: number) => void; low: string; high: string }) {
  return (
    <div>
      <div className="scale">
        {[1, 2, 3, 4, 5].map((n) => (
          <button type="button" key={n} className={value === n ? "on" : ""} onClick={() => onChange(n)}>{n}</button>
        ))}
      </div>
      <div className="row between small muted"><span>{low}</span><span>{high}</span></div>
    </div>
  );
}

function CheckInForm({ role, date, initial, onSaved }: { role: "parent" | "athlete"; date: string; initial: CheckIn | null; onSaved: (c: CheckIn) => void }) {
  const [c, setC] = useState<Partial<CheckIn>>(initial ?? { pain: false });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const set = <K extends keyof CheckIn>(k: K, v: CheckIn[K]) => setC((x) => ({ ...x, [k]: v }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErr("");
    try {
      const r = await api<{ checkIn: CheckIn }>("/api/checkin", { body: { ...c, date } });
      onSaved(r.checkIn);
    } catch (e) {
      setErr((e as Error).message);
      setBusy(false);
    }
  }

  return (
    <form className="card" onSubmit={submit} style={{ display: "grid", gap: 14 }}>
      <h2>Check in</h2>
      <div className="grid2">
        <label>Sleep (hours)<input type="number" inputMode="decimal" step="0.5" value={c.sleepHours ?? ""} onChange={(e) => set("sleepHours", e.target.value === "" ? undefined : Number(e.target.value))} /></label>
        {role === "athlete" ? null : (
          <label>Weight (lb)<input type="number" inputMode="decimal" step="0.1" value={c.weightLb ?? ""} onChange={(e) => set("weightLb", e.target.value === "" ? undefined : Number(e.target.value))} /></label>
        )}
      </div>
      <label>Energy<Scale value={c.energy} onChange={(n) => set("energy", n)} low="Wiped" high="Great" /></label>
      <label>Soreness<Scale value={c.soreness} onChange={(n) => set("soreness", n)} low="None" high="Very sore" /></label>
      {role === "athlete" && <label>Arm feel<Scale value={c.armFeel} onChange={(n) => set("armFeel", n)} low="Bad" high="Great" /></label>}
      <label style={{ flexDirection: "row", alignItems: "center", gap: 10, color: "var(--text)", fontSize: 15 }}>
        <input type="checkbox" checked={!!c.pain} onChange={(e) => set("pain", e.target.checked)} style={{ width: 22, height: 22 }} />
        Pain anywhere (not just soreness)
      </label>
      {c.pain && <label>Where and what does it feel like?<input value={c.painWhere ?? ""} onChange={(e) => set("painWhere", e.target.value)} /></label>}
      <label>Anything different today?<input value={c.schedule ?? ""} onChange={(e) => set("schedule", e.target.value)} placeholder={role === "athlete" ? "Lesson at 6, team practice, test…" : "Late meeting, travel, dinner out…"} /></label>
      <label>Notes<input value={c.notes ?? ""} onChange={(e) => set("notes", e.target.value)} placeholder={role === "athlete" ? "Lesson cues, how practice went…" : "How yesterday went…"} /></label>
      {err && <p className="error">{err}</p>}
      <button className="primary" disabled={busy}>{busy ? "Saving…" : "Save & build today's plan"}</button>
    </form>
  );
}

function CheckInSummary({ c, role, onEdit }: { c: CheckIn; role: "parent" | "athlete"; onEdit?: () => void }) {
  const stats: [string, string | number | undefined][] = [
    ["Sleep", c.sleepHours != null ? `${c.sleepHours}h` : undefined],
    ["Energy", c.energy],
    ["Soreness", c.soreness],
    role === "athlete" ? ["Arm", c.armFeel] : ["Weight", c.weightLb],
  ];
  return (
    <div className="card">
      <div className="row between"><h2 style={{ margin: 0 }}>Check-in</h2>{onEdit && <button className="link" onClick={onEdit}>Edit</button>}</div>
      <div className="stats" style={{ marginTop: 10 }}>
        {stats.map(([k, v]) => <div className="stat" key={k}><b>{v ?? "–"}</b>{k}</div>)}
      </div>
      {c.pain && <p className="warn small" style={{ marginTop: 10 }}><b>Pain:</b> {c.painWhere || "reported"}</p>}
      {(c.schedule || c.notes) && <p className="small muted">{[c.schedule, c.notes].filter(Boolean).join(" · ")}</p>}
    </div>
  );
}
