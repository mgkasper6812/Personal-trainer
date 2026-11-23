"use client";
import Link from "next/link";
import BackButton from "./BackButton";
import { useEffect, useState } from "react";
import { api } from "@/lib/client";
import type { WorkoutSummary } from "@/lib/types";
import { fmtClock } from "@/lib/workout-client";

export default function History({ viewUser }: { viewUser: string | null }) {
  const [r, setR] = useState<{ name: string; workouts: WorkoutSummary[] } | null>(null);
  const [err, setErr] = useState("");
  useEffect(() => { api<{ name: string; workouts: WorkoutSummary[] }>(`/api/workouts${viewUser ? `?user=${viewUser}` : ""}`).then(setR, (e) => setErr(e.message)); }, [viewUser]);
  if (!r) return <main>{err ? <p className="error">{err}</p> : <p className="muted"><span className="spinner" />Loading…</p>}</main>;

  const q = viewUser ? `?user=${viewUser}` : "";
  const byMonth = new Map<string, WorkoutSummary[]>();
  for (const w of r.workouts) {
    const k = new Date(`${w.date}T12:00:00`).toLocaleDateString(undefined, { month: "long", year: "numeric" });
    byMonth.set(k, [...(byMonth.get(k) ?? []), w]);
  }
  const last28 = r.workouts.filter((w) => Date.now() - Date.parse(`${w.date}T12:00:00`) < 28 * 86400000).length;
  return (
    <main>
      <BackButton fallback={viewUser ? `/progress?user=${viewUser}` : "/progress"} />
      <h1>{viewUser ? `${r.name}'s history` : "History"}</h1>
      <div className="stats" style={{ marginBottom: 14 }}>
        <div className="stat"><b>{r.workouts.length}</b>workouts</div>
        <div className="stat"><b>{last28}</b>last 4 weeks</div>
        <div className="stat"><b>{r.workouts.reduce((a, w) => a + w.prs, 0)}</b>records</div>
      </div>
      {!r.workouts.length && <p className="muted">No workouts yet. Finish one and it shows up here.</p>}
      {[...byMonth].map(([m, ws]) => (
        <section key={m}>
          <h3>{m} · {ws.length}</h3>
          {ws.map((w) => (
            <Link key={w.id} href={`/history/${w.id}${q}`} className="card hist-card">
              <div className="row between"><b>{w.name}</b><span className="small muted">{new Date(`${w.date}T12:00:00`).toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })}</span></div>
              <div className="row small muted" style={{ gap: 12 }}>
                <span>{fmtClock((Date.parse(w.endedAt) - Date.parse(w.startedAt)) / 1000)}</span>
                <span>{w.sets} set{w.sets === 1 ? "" : "s"}</span>{w.volume > 0 && <span>{w.volume.toLocaleString()} lb</span>}
                {w.prs > 0 && <span style={{ color: "var(--accent)" }}>{w.prs} PR</span>}{w.watch && <span>Watch</span>}
              </div>
            </Link>
          ))}
        </section>
      ))}
    </main>
  );
}
