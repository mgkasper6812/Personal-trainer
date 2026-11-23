"use client";
import { useEffect, useState } from "react";
import BackButton from "./BackButton";
import { api } from "@/lib/client";
import type { ExerciseStats } from "@/lib/data";
import { getExercise } from "@/lib/exercises";
import type { ExercisePoint } from "@/lib/stats";
import { LineChart } from "./ui";
import { DemoVideo, ExerciseGuideView } from "./ExerciseInfo";

type Metric = { key: keyof ExercisePoint; label: string; unit: string; lower?: boolean };
const METRICS: Record<string, Metric[]> = {
  weight_reps: [{ key: "e1rm", label: "Est. 1RM", unit: "lb" }, { key: "topWeight", label: "Heaviest", unit: "lb" }, { key: "volume", label: "Volume", unit: "lb" }],
  reps: [{ key: "reps", label: "Most reps", unit: "reps" }],
  duration: [{ key: "seconds", label: "Longest", unit: "s" }],
  cardio: [{ key: "minutes", label: "Minutes", unit: "min" }],
  swings: [{ key: "topSpeed", label: "Top bat speed", unit: "mph" }, { key: "topEV", label: "Top exit velo", unit: "mph" }, { key: "swings", label: "Swings", unit: "" }],
  throws: [{ key: "topSpeed", label: "Top velo", unit: "mph" }, { key: "best", label: "Longest", unit: "ft" }],
  sprint: [{ key: "best", label: "Fastest", unit: "s", lower: true }],
  jump: [{ key: "best", label: "Best", unit: "in" }],
};

export default function ExerciseDetail({ id, viewUser }: { id: string; viewUser: string | null }) {
  const e = getExercise(id);
  const [st, setSt] = useState<ExerciseStats | null>(null);
  const [m, setM] = useState(0);
  useEffect(() => {
    api<{ stats: Record<string, ExerciseStats> }>(`/api/exercises/stats?ids=${id}${viewUser ? `&user=${viewUser}` : ""}`).then((r) => setSt(r.stats[id] ?? { last: null, history: [] }), () => {});
  }, [id, viewUser]);
  if (!e) return <main><p>Unknown exercise.</p></main>;
  const metrics = METRICS[e.kind] ?? [];
  const metric = metrics[m];
  const pts = (st?.history ?? []).filter((h) => metric && h[metric.key] != null).map((h) => ({ x: h.date, y: h[metric!.key] as number }));
  const best = pts.length ? (metric?.lower ? Math.min(...pts.map((p) => p.y)) : Math.max(...pts.map((p) => p.y))) : null;
  return (
    <main>
      <BackButton fallback="/routines" />
      <h1>{e.name}</h1>
      <p className="small muted" style={{ marginTop: -6 }}>{e.muscles.join(", ")} · {e.equipment.join(", ")}</p>
      <DemoVideo id={id} />
      <section className="card"><ExerciseGuideView id={id} /></section>
      {metrics.length > 0 && (
        <div className="card">
          <div className="chips" style={{ marginBottom: 10 }}>
            {metrics.map((x, i) => <button key={x.key} className={`chip ${i === m ? "on" : ""}`} onClick={() => setM(i)}>{x.label}</button>)}
          </div>
          <span className="eyebrow">Your progress</span>
          {best != null && <p style={{ margin: "0 0 6px" }}><b style={{ fontSize: 24 }}>{best}</b> <span className="muted">{metric?.unit} best</span></p>}
          {st ? <LineChart points={pts} unit={metric?.unit ?? ""} lowerIsBetter={metric?.lower} /> : <p className="muted"><span className="spinner" />Loading…</p>}
        </div>
      )}
      {st && st.history.length > 0 && (
        <div className="card">
          <h2>History</h2>
          {[...st.history].reverse().slice(0, 30).map((h, i) => (
            <p key={i} className="small row between" style={{ margin: "6px 0" }}>
              <span>{new Date(`${h.date}T12:00:00`).toLocaleDateString(undefined, { month: "short", day: "numeric" })}</span>
              <span className="muted">{metrics.map((x) => (h[x.key] != null ? `${x.label}: ${h[x.key]}${x.unit ? ` ${x.unit}` : ""}` : null)).filter(Boolean).join(" · ")}</span>
            </p>
          ))}
        </div>
      )}
    </main>
  );
}
