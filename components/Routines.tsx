"use client";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { api, localDate } from "@/lib/client";
import type { ExerciseStats, ProgramRecord } from "@/lib/data";
import { EXERCISES, getExercise } from "@/lib/exercises";
import { loadActive, startWorkout } from "@/lib/workout-client";
import { IconChevron, IconSearch } from "./icons";
import TonightCard from "./TonightCard";

const DAY = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const SEGS = [["program", "Program"], ["routines", "Routines"], ["exercises", "Exercises"]] as const;
const FILTERS = ["All", "lower", "upper", "core", "hitting", "speed", "throwing", "plyo", "cardio", "mobility"] as const;
const EMPH = ["var(--accent)", "var(--accent2)", "var(--muted)", "var(--yellow)"];

export default function Routines({ viewUser }: { viewUser: string | null }) {
  const [r, setR] = useState<{ name: string; self: boolean; record: ProgramRecord | null } | null>(null);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const [seg, setSeg] = useState<(typeof SEGS)[number][0]>("program");
  const [hasActive, setHasActive] = useState(false);
  const [q, setQ] = useState("");
  const [f, setF] = useState<(typeof FILTERS)[number]>("All");
  const [best, setBest] = useState<Record<string, ExerciseStats>>({});

  useEffect(() => {
    setHasActive(!!loadActive());
    api<{ name: string; self: boolean; record: ProgramRecord | null }>(`/api/program${viewUser ? `?user=${viewUser}` : ""}`).then((x) => {
      setR(x);
      const ids = [...new Set(x.record?.program.routines.flatMap((rt) => rt.exercises.map((e) => e.exerciseId)) ?? [])].slice(0, 40);
      if (ids.length) api<{ stats: Record<string, ExerciseStats> }>(`/api/exercises/stats?ids=${ids.join(",")}${viewUser ? `&user=${viewUser}` : ""}`).then((s) => setBest(s.stats), () => {});
    }, (e) => setErr(e.message));
  }, [viewUser]);

  const library = useMemo(() => {
    const t = q.trim().toLowerCase();
    return EXERCISES.filter((e) => (f === "All" || e.tags.includes(f)) && (!t || `${e.name} ${e.muscles.join(" ")} ${e.equipment.join(" ")}`.toLowerCase().includes(t)));
  }, [q, f]);

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
  const today = new Date().getDay();
  const bestLabel = (id: string) => {
    const h = best[id]?.history; if (!h?.length) return null;
    const last = h[h.length - 1];
    const e = getExercise(id)!;
    if (e.kind === "weight_reps") { const top = Math.max(...h.map((x) => x.topWeight ?? 0)); return top ? `${top} lb` : null; }
    if (e.kind === "swings" && last.topSpeed) return `${Math.max(...h.map((x) => x.topSpeed ?? 0))} mph`;
    if (e.kind === "sprint" && last.best) return `${Math.min(...h.map((x) => x.best ?? 99))} s`;
    return null;
  };

  return (
    <main>
      <div className="row between" style={{ marginBottom: 12 }}>
        <h1 style={{ margin: 0 }}>{viewUser ? `${r.name}'s training` : "Train"}</h1>
        {r.self && <button className="pill-btn" onClick={() => startWorkout(null, localDate())}>+ Empty workout</button>}
      </div>
      <div className="seg3" role="tablist">
        {SEGS.map(([k, label]) => <button key={k} role="tab" aria-selected={seg === k} className={seg === k ? "on" : ""} onClick={() => setSeg(k)}>{label}</button>)}
      </div>
      {!p && <p className="muted">No program yet.</p>}

      {p && seg === "program" && (<>
        <section className="card">
          <h2 style={{ marginBottom: 4 }}>{p.title}</h2>
          <div className="row between small" style={{ flexWrap: "nowrap", gap: 10 }}>
            <span className="muted">Starts</span>
            {r.self ? <input type="date" value={r.record!.startDate} onChange={(e) => changeStart(e.target.value)} style={{ maxWidth: 170 }} aria-label="Program start date" />
              : <b>{r.record!.startDate}</b>}
          </div>
          <div className="week-grid">
            {[1, 2, 3, 4, 5, 6, 0].map((d) => {
              const s = p.schedule.find((x) => x.dayOfWeek === d);
              const rt = s?.routineKey ? p.routines.find((x) => x.key === s.routineKey) : null;
              return <div key={d} className={`${rt ? "on" : ""} ${d === today ? "today" : ""}`}><b>{DAY[d]}</b><span>{rt?.name ?? s?.note ?? "Rest"}</span></div>;
            })}
          </div>
          <p className="small muted" style={{ margin: 0 }}>{p.summary}</p>
        </section>
        <section className="card">
          <span className="eyebrow">Where the time goes</span>
          {p.emphasis.map((e, i) => (
            <div key={e.area} style={{ marginTop: 10 }}>
              <div className="row between small"><span>{e.area}</span><b>{e.percent}%</b></div>
              <div className="progress"><div style={{ width: `${e.percent}%`, background: EMPH[i % EMPH.length] }} /></div>
            </div>
          ))}
        </section>
        {p.nutrition && (
          <section className="card">
            <span className="eyebrow">Nutrition</span>
            <div className="stats" style={{ margin: "10px 0" }}><div className="stat"><b className="display">{p.nutrition.calories.toLocaleString()}</b>calories</div><div className="stat"><b className="display">{p.nutrition.proteinG}g</b>protein</div></div>
            <p className="small muted" style={{ margin: 0 }}>{p.nutrition.carbApproach}</p>
          </section>
        )}
        {p.nutrition && <TonightCard collapsible tvTime={null} kitchenCloses={null} swaps={[]} plan={p.nutrition.eveningPlan} />}
        {p.fueling && <section className="card"><span className="eyebrow">Fueling</span><p className="small" style={{ marginBottom: 0 }}>{p.fueling}</p></section>}
        <section className="card">
          <span className="eyebrow">Week by week</span>
          {p.weeks.map((w) => <p key={w.week} className="small"><b>Week {w.week}{w.deload ? " (lighter)" : ""}:</b> <span className="muted">{w.theme} — {w.progression}</span></p>)}
          <span className="eyebrow">Rules</span>
          <ul className="checks" style={{ marginTop: 6 }}>{p.rules.map((x) => <li key={x} className="small">{x}</li>)}</ul>
        </section>
        {r.self && (
          <p style={{ textAlign: "center" }}>
            <button className="link" onClick={regenerate} disabled={busy}>{busy ? <><span className="spinner" />Building a new program…</> : "Rebuild program with the coach"}</button>
          </p>
        )}
      </>)}

      {p && seg === "routines" && p.routines.map((rt) => {
        const days = p.schedule.filter((s) => s.routineKey === rt.key).map((s) => DAY[s.dayOfWeek]).join(" · ");
        return (
          <section className="card" key={rt.key}>
            <div className="row between"><h2 style={{ margin: 0 }}>{rt.name}</h2><span className="small muted">{days}</span></div>
            <p className="small muted" style={{ margin: "6px 0 10px" }}>{rt.exercises.map((e) => getExercise(e.exerciseId)?.name).join(", ")}</p>
            {r.self && (
              <div className="row" style={{ flexWrap: "nowrap" }}>
                <button className="primary" style={{ flexGrow: 1 }} onClick={() => startWorkout(rt, localDate())}>{hasActive ? "Start (replaces current)" : "Start"}</button>
                <Link href={`/routines/${rt.key}`} className="ghost-btn">Edit</Link>
              </div>
            )}
          </section>
        );
      })}

      {seg === "exercises" && (<>
        <label className="search">
          <IconSearch size={18} />
          <input aria-label="Search exercises" placeholder={`Search ${EXERCISES.length} exercises`} value={q} onChange={(e) => setQ(e.target.value)} />
        </label>
        <div className="chips scroll-x" style={{ margin: "10px 0" }}>
          {FILTERS.map((x) => <button key={x} className={`chip ${f === x ? "on" : ""}`} onClick={() => setF(x)}>{x === "All" ? "All" : x[0].toUpperCase() + x.slice(1)}</button>)}
        </div>
        <div className="card" style={{ padding: "0 16px" }}>
          {library.map((e) => (
            <Link key={e.id} href={`/exercise/${e.id}${viewUser ? `?user=${viewUser}` : ""}`} className="lib-row">
              <span style={{ flexGrow: 1 }}><b>{e.name}</b><span className="small muted">{e.muscles.join(", ")} · {e.equipment.join(", ")}</span></span>
              {bestLabel(e.id) && <span className="best">{bestLabel(e.id)}</span>}
              <IconChevron size={16} />
            </Link>
          ))}
          {!library.length && <p className="small muted">No matches.</p>}
        </div>
      </>)}
      {err && <p className="error">{err}</p>}
    </main>
  );
}
