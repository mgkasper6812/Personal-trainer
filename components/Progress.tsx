"use client";
import Link from "next/link";
import BackButton from "./BackButton";
import { useEffect, useState } from "react";
import { api, localDate } from "@/lib/client";
import type { WorkoutSummary } from "@/lib/types";
import { fmtClock } from "@/lib/workout-client";
import { IconChevron } from "./icons";
import { LineChart } from "./ui";

type Res = {
  user: { id: string; name: string; self: boolean }; kind: "adult" | "athlete" | null;
  goal: { start: number; target: number | null } | null; people: { id: string; name: string }[];
  weights: { date: string; lb: number }[]; batSpeed: { date: string; mph: number }[];
  cells: { date: string; state: "workout" | "half" | "rest" | "future" }[];
  records: { name: string; label: string; value: number; unit: string; date: string }[];
  workouts: WorkoutSummary[];
};

const avg7 = (pts: { date: string; lb: number }[]) => pts.map((p) => {
  const t = Date.parse(p.date);
  const win = pts.filter((q) => { const d = (t - Date.parse(q.date)) / 86400000; return d >= 0 && d < 7; });
  return { x: p.date, y: Math.round((win.reduce((a, q) => a + q.lb, 0) / win.length) * 10) / 10 };
});
const short = (d: string) => new Date(`${d}T12:00:00`).toLocaleDateString(undefined, { month: "short", day: "numeric" });

export default function Progress({ viewUser }: { viewUser: string | null }) {
  const [r, setR] = useState<Res | null>(null);
  const [err, setErr] = useState("");
  useEffect(() => { setR(null); api<Res>(`/api/progress?date=${localDate()}${viewUser ? `&user=${viewUser}` : ""}`).then(setR, (e) => setErr(e.message)); }, [viewUser]);
  if (!r) return <main>{err ? <p className="error">{err}</p> : <p className="muted"><span className="spinner" />Loading…</p>}</main>;

  const q = viewUser ? `?user=${viewUser}` : "";
  const adult = r.kind === "adult";
  let trend: React.ReactNode;
  if (adult) {
    const pts = avg7(r.weights);
    const latest = pts.at(-1)?.y;
    const start = r.goal?.start ?? r.weights[0]?.lb;
    const delta = latest != null && start ? Math.round((latest - start) * 10) / 10 : null;
    const m1 = start ? `${Math.round(start * 0.93)}–${Math.round(start * 0.95)} lb` : null;
    trend = (
      <section className="card">
        <span className="eyebrow">Weight · 7-day average</span>
        {latest != null ? (<>
          <div className="row" style={{ gap: 10, alignItems: "baseline", margin: "4px 0" }}>
            <b className="display big-num">{latest} lb</b>
            {delta != null && <span className="delta" style={{ color: delta <= 0 ? "var(--accent)" : "var(--warn)" }}>{delta > 0 ? "+" : "−"}{Math.abs(delta)} lb</span>}
          </div>
          {m1 && <p className="small muted" style={{ marginTop: 0 }}>First milestone (5–7%): {m1}{r.goal?.target ? ` · target ${r.goal.target} lb` : ""}</p>}
          <LineChart points={pts} unit="lb" lowerIsBetter />
        </>) : <p className="small muted">Log your weight in the morning check-in (or sync your smart scale) to see your trend.</p>}
      </section>
    );
  } else {
    const pts = r.batSpeed.map((b) => ({ x: b.date, y: b.mph }));
    const latest = pts.at(-1)?.y;
    const delta = pts.length > 1 ? Math.round((pts.at(-1)!.y - pts[0].y) * 10) / 10 : null;
    trend = (
      <section className="card">
        <span className="eyebrow">Bat speed · best per session</span>
        {latest != null ? (<>
          <div className="row" style={{ gap: 10, alignItems: "baseline", margin: "4px 0" }}>
            <b className="display big-num">{latest} mph</b>
            {delta != null && <span className="delta" style={{ color: delta >= 0 ? "var(--accent)" : "var(--warn)" }}>{delta >= 0 ? "+" : "−"}{Math.abs(delta)} mph</span>}
          </div>
          <p className="small muted" style={{ marginTop: 0 }}>16U–18U travel band: 54–66 mph (Blast Motion)</p>
          <LineChart points={pts} unit="mph" />
        </>) : <p className="small muted">Log bat speed on any swing exercise (tee, front toss, dry swings) to see your trend.</p>}
      </section>
    );
  }
  const counted = r.cells.filter((c) => c.state !== "future");
  const workoutDays = counted.filter((c) => c.state === "workout").length;

  return (
    <main>
      {r.people.length > 0 && <BackButton fallback="/today" />}
      <div className="row between" style={{ marginBottom: 14 }}>
        <h1 style={{ margin: 0 }}>Progress</h1>
        {r.people.length > 1 && (
          <div className="toggle">
            {r.people.map((p) => {
              const on = p.id === r.user.id;
              return <Link key={p.id} href={p.name === "Me" ? "/progress" : `/progress?user=${p.id}`} className={on ? "on" : ""} aria-current={on ? "page" : undefined}>{p.name}</Link>;
            })}
          </div>
        )}
      </div>

      {trend}

      <section className="card">
        <div className="row between"><span className="eyebrow">Consistency · 4 weeks</span><b className="small">{workoutDays} workout day{workoutDays === 1 ? "" : "s"}</b></div>
        <div className="heat">
          {["M", "T", "W", "T", "F", "S", "S"].map((x, i) => <span key={i} className="heat-h">{x}</span>)}
          {r.cells.map((c) => <i key={c.date} className={c.state} title={`${c.date}: ${c.state}`} />)}
        </div>
        <div className="row small muted" style={{ gap: 14 }}>
          <span className="row" style={{ gap: 5 }}><i className="key workout" />Workout</span>
          <span className="row" style={{ gap: 5 }}><i className="key half" />{adult ? "Evening on plan" : "Checked in"}</span>
          <span className="row" style={{ gap: 5 }}><i className="key rest" />Rest</span>
        </div>
      </section>

      <section className="card">
        <span className="eyebrow">Recent records</span>
        {!r.records.length && <p className="small muted">Beat a previous best and it shows up here.</p>}
        {r.records.map((x, i) => (
          <div key={i} className="rec-row">
            <span><b>{x.name}</b><span className="small muted">{x.label} · {short(x.date)}</span></span>
            <span className="rec-val">{x.value} {x.unit}</span>
          </div>
        ))}
      </section>

      <section className="card" style={{ paddingBottom: 6 }}>
        <div className="row between"><span className="eyebrow">Workouts</span><Link href={`/history${q}`} className="small">See all</Link></div>
        {!r.workouts.length && <p className="small muted">Finish a workout and it shows up here.</p>}
        {r.workouts.slice(0, 5).map((w) => (
          <Link key={w.id} href={`/history/${w.id}${q}`} className="lib-row">
            <span style={{ flexGrow: 1 }}><b>{w.name}</b><span className="small muted">{short(w.date)} · {fmtClock((Date.parse(w.endedAt) - Date.parse(w.startedAt)) / 1000)} · {w.sets} set{w.sets === 1 ? "" : "s"}{w.volume ? ` · ${w.volume.toLocaleString()} lb` : ""}</span></span>
            {w.prs > 0 && <span className="best">{w.prs} PR</span>}
            <IconChevron size={16} />
          </Link>
        ))}
      </section>
    </main>
  );
}
