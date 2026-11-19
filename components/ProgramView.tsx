"use client";
import { useEffect, useState } from "react";
import { api } from "@/lib/client";
import type { ProgramRecord } from "@/lib/data";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function ProgramView({ viewUser }: { viewUser: string | null }) {
  const [r, setR] = useState<{ name: string; record: ProgramRecord | null } | null>(null);
  const [err, setErr] = useState("");
  const [open, setOpen] = useState<number | null>(null);

  useEffect(() => {
    api<{ name: string; record: ProgramRecord | null }>(`/api/program${viewUser ? `?user=${viewUser}` : ""}`).then(setR, (e) => setErr(e.message));
  }, [viewUser]);

  if (err) return <main><p className="error">{err}</p></main>;
  if (!r) return <main><p className="muted"><span className="spinner" />Loading…</p></main>;
  if (!r.record) return <main><h1>Program</h1><p className="muted">{r.name} hasn&apos;t finished setup yet.</p></main>;
  const p = r.record.program;
  const order = [1, 2, 3, 4, 5, 6, 0];
  const days = order.map((d) => p.weeklyTemplate.find((t) => t.dayOfWeek === d)).filter((d): d is NonNullable<typeof d> => !!d);

  return (
    <main>
      {viewUser && <p className="warn small">{r.name}&apos;s program</p>}
      <h1>{p.title}</h1>
      <p className="muted small">Block {p.blockNumber} · {p.blockWeeks} weeks from {new Date(`${r.record.startDate}T12:00:00`).toLocaleDateString(undefined, { month: "short", day: "numeric" })}</p>
      <div className="card">
        <p>{p.summary}</p>
        <h3>Where the time goes</h3>
        {p.emphasis.map((e) => (
          <div key={e.area} style={{ marginBottom: 8 }}>
            <div className="row between small"><span>{e.area}</span><span>{e.percent}%</span></div>
            <div className="progress"><div style={{ width: `${e.percent}%` }} /></div>
          </div>
        ))}
      </div>

      {p.nutrition && (
        <div className="card">
          <h2>Nutrition</h2>
          <div className="stats">
            <div className="stat"><b>{p.nutrition.calories.toLocaleString()}</b>calories</div>
            <div className="stat"><b>{p.nutrition.proteinG}g</b>protein</div>
          </div>
          <p>{p.nutrition.approach}</p>
          <p className="warn small"><b>Evenings:</b> {p.nutrition.eveningStrategy}</p>
        </div>
      )}

      <div className="card">
        <h2>Weekly template</h2>
        {days.map((d) => (
          <div key={d.dayOfWeek} style={{ borderTop: "1px solid var(--line)", padding: "10px 0" }}>
            <button className="link" style={{ width: "100%", textAlign: "left", color: "var(--text)" }} onClick={() => setOpen(open === d.dayOfWeek ? null : d.dayOfWeek)}>
              <b style={{ display: "inline-block", width: 44 }}>{DAYS[d.dayOfWeek]}</b>{d.title}
              <span className="muted small">{d.minutes ? ` · ${d.minutes} min` : ""}</span>
            </button>
            {open === d.dayOfWeek && d.sections.map((s, i) => (
              <div key={i} style={{ paddingLeft: 44 }}>
                <h3>{s.title}</h3>
                {s.items.map((it, j) => (
                  <p key={j} className="small"><b>{it.name}</b> — {it.prescription}{it.notes && <span className="muted"> · {it.notes}</span>}</p>
                ))}
              </div>
            ))}
          </div>
        ))}
      </div>

      <div className="card">
        <h2>Week by week</h2>
        {p.weeks.map((w) => (
          <p key={w.week} className="small"><b>Week {w.week}{w.deload ? " (deload)" : ""}:</b> {w.theme} — {w.progression}</p>
        ))}
      </div>

      {p.tests.length > 0 && (
        <div className="card">
          <h2>Tests</h2>
          {p.tests.map((t) => (
            <p key={t.name} className="small"><b>{t.name}</b> ({t.unit}) — {t.protocol} <span className="muted">· {t.when}</span></p>
          ))}
        </div>
      )}

      <div className="card">
        <h2>Rules</h2>
        <ul>{p.rules.map((x) => <li key={x}>{x}</li>)}</ul>
      </div>
    </main>
  );
}
