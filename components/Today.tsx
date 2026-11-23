"use client";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { api, localDate } from "@/lib/client";
import { getExercise, type Region } from "@/lib/exercises";
import { ADULT_SYMPTOMS, ATHLETE_RED_FLAGS, type Readiness } from "@/lib/rules";
import type { Routine } from "@/lib/schemas";
import type { CheckIn, EveningLog, WorkoutSummary } from "@/lib/types";
import { startWorkout } from "@/lib/workout-client";
import { IconCheck, IconChevron, IconClose, IconPlay } from "./icons";
import ProteinCard from "./ProteinCard";
import { ExerciseSheet } from "./ExerciseInfo";
import { rxParts } from "@/lib/rx";
import TonightCard from "./TonightCard";
import { Chips, Field, Scale, Segmented, Stepper } from "./ui";

type TodayRes = {
  dinner: { id: string; title: string; timeMin: number; plateTip: string } | null;
  user: { id: string; name: string; role: "parent" | "athlete"; self: boolean };
  me: { id: string; name: string; role: "parent" | "athlete" };
  family: { id: string; name: string; alerts: number }[];
  weekStats: { done: number; planned: number; activeMin: number; eveningsOnPlan: number; eveningsLogged: number };
  date: string; weekday: string; hasProfile: boolean; hasProgram: boolean; profileKind: "adult" | "athlete" | null;
  program: { title: string; week: number; blockWeeks: number; weekInfo: { theme: string; deload: boolean } | null } | null;
  slotNote: string | null; startDate: string | null; routine: Routine | null; baseRoutineKey: string | null; readiness: Readiness | null;
  checkIn: CheckIn | null; evening: EveningLog | null;
  tonight: { tvTime: string; kitchenCloses: string | null; swaps: string[]; plan: unknown } | null;
  nutrition: { calories: number; proteinG: number; carbApproach: string } | null; fueling: string | null;
  habitList: { name: string; custom: boolean }[]; habitWeek: Record<string, string[]>;
  weekStrip: { date: string; dow: number; routine: string | null; done: boolean }[];
  workoutsToday: WorkoutSummary[];
};

const REGIONS: Region[] = ["shoulder", "elbow", "wrist", "back", "hip", "knee", "ankle", "neck"];
const D = ["S", "M", "T", "W", "T", "F", "S"];
const STATUS = { green: "Ready", yellow: "Adjusted", red: "Recovery" } as const;
const greeting = () => { const h = new Date().getHours(); return h < 12 ? "Morning" : h < 17 ? "Afternoon" : "Evening"; };

function Ring({ r, value, max, color }: { r: number; value: number; max: number; color: string }) {
  const c = 2 * Math.PI * r;
  const f = max > 0 ? Math.min(1, value / max) : 0;
  return (<>
    <circle cx="44" cy="44" r={r} fill="none" stroke="var(--track)" strokeWidth="8" />
    <circle cx="44" cy="44" r={r} fill="none" stroke={color} strokeWidth="8" strokeLinecap="round" strokeDasharray={`${c * f} ${c}`} transform="rotate(-90 44 44)" />
  </>);
}

export default function Today({ viewUser }: { viewUser: string | null }) {
  const [date, setDate] = useState(localDate());
  const [d, setD] = useState<TodayRes | null>(null);
  const [err, setErr] = useState("");
  const [sheet, setSheet] = useState(false);

  const load = useCallback(async () => {
    setErr("");
    try { setD(await api<TodayRes>(`/api/today?date=${date}${viewUser ? `&user=${viewUser}` : ""}`)); }
    catch (e) { setErr((e as Error).message); }
  }, [date, viewUser]);
  useEffect(() => { load(); }, [load]);

  const isToday = date === localDate();
  const self = d?.user.self ?? !viewUser;
  const r = d?.readiness;
  const adult = d?.profileKind === "adult";

  async function logEvening(v: EveningLog) {
    setD((x) => (x ? { ...x, evening: v } : x));
    try { await api("/api/evening", { body: { date, value: v } }); load(); } catch (e) { setErr((e as Error).message); }
  }

  const dateLabel = new Date(`${date}T12:00:00`).toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
  return (
    <main>
      <header className="home-head">
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="eyebrow">{dateLabel}{!isToday && <> · <button className="link" onClick={() => setDate(localDate())}>Back to today</button></>}</div>
          <h1 style={{ margin: "2px 0 0" }}>{viewUser && d ? `${d.user.name}'s day` : `${greeting()}${d ? `, ${d.me.name}` : ""}`}</h1>
        </div>
        {d && viewUser && <Link href="/today" className="switch-chip"><span className="avatar" style={{ background: "var(--accent)", color: "var(--accent-ink)" }}>{d.me.name[0]}</span>Me</Link>}
        <div className="row" style={{ gap: 8, flexWrap: "nowrap" }}>
        {d && !viewUser && d.family.slice(0, 1).map((f) => (
          <Link key={f.id} href={`/today?user=${f.id}`} className="switch-chip" aria-label={`Switch to ${f.name}${f.alerts ? `, ${f.alerts} alert` : ""}`}>
            <span className="avatar">{f.name[0]}</span>{f.name}{f.alerts > 0 && <span className="alert-dot" />}
          </Link>
        ))}
        {d && !viewUser && <Link href="/me" className="me-btn" aria-label="Me: profile and settings">{d.me.name.slice(0, 1).toUpperCase()}</Link>}
        </div>
      </header>

      {err && <p className="error">{err}</p>}
      {!d && !err && <p className="muted"><span className="spinner" />Loading…</p>}
      {d && !d.hasProgram && (
        <div className="card"><h2>{self ? "Let's set you up" : `${d.user.name} hasn't finished setup`}</h2>{self && <Link href="/onboarding">Start setup →</Link>}</div>
      )}

      {d?.hasProgram && (<>
        <section className="card week-card">
          <div className="row" style={{ gap: 14, flexWrap: "nowrap" }}>
            <svg width="88" height="88" viewBox="0 0 88 88" role="img" aria-label={`${d.weekStats.done} of ${d.weekStats.planned} workouts, ${d.weekStats.activeMin} of 150 active minutes`}>
              <Ring r={38} value={d.weekStats.done} max={d.weekStats.planned || 1} color="var(--accent)" />
              <Ring r={26} value={d.weekStats.activeMin} max={150} color="var(--accent2)" />
            </svg>
            <div style={{ flexGrow: 1, display: "grid", gap: 6 }}>
              <span className="eyebrow">This week</span>
              <div className="legend"><i style={{ background: "var(--accent)" }} /><b className="display">{d.weekStats.done}/{d.weekStats.planned}</b><span>workouts</span></div>
              <div className="legend"><i style={{ background: "var(--accent2)" }} /><b className="display">{d.weekStats.activeMin}/150</b><span>active min</span></div>
            </div>
            {adult && (
              <div className="side-stat"><b className="display">{d.weekStats.eveningsOnPlan}/7</b><span>evenings on plan</span></div>
            )}
          </div>
          {self && d.me.role === "parent" && <Link href="/progress" className="small" style={{ display: "block", textAlign: "right", marginTop: 8 }}>See progress ›</Link>}
          <div className="day-dots">
            {d.weekStrip.map((x) => (
              <button key={x.date} onClick={() => setDate(x.date)} className={`${x.date === date ? "sel" : ""} ${x.done ? "done" : x.routine ? "train" : ""}`}
                aria-label={`${x.date}${x.routine ? `: ${x.routine}` : ""}${x.done ? ", done" : ""}`}>
                <span>{D[x.dow]}</span><i />
              </button>
            ))}
          </div>
        </section>

        {r?.urgent && <div className="card urgent"><b>Stop.</b> {r.urgent}</div>}

        {self ? (
          <button className="checkin-row" onClick={() => setSheet(true)}>
            <span className={`ci-icon ${d.checkIn ? "done" : ""}`}><IconCheck size={18} /></span>
            <span style={{ flexGrow: 1 }}>
              {d.checkIn ? <>Checked in <span className={`pill ${r?.status ?? "green"}`} style={{ marginLeft: 6 }}>{STATUS[r?.status ?? "green"]}</span></> : <>Check in <span className="muted" style={{ fontWeight: 500 }}>· 30 sec</span></>}
            </span>
            <span className="muted small">{d.checkIn ? "Edit" : ""}</span><IconChevron size={18} />
          </button>
        ) : d.checkIn ? <CheckInSummary c={d.checkIn} r={r ?? null} athlete={d.profileKind === "athlete"} /> : <p className="muted small">No check-in yet.</p>}

        <PlanCard d={d} date={date} self={self} />

        {d.tonight && (
          <TonightCard collapsible dinner={d.dinner} tvTime={d.tonight.tvTime} kitchenCloses={d.tonight.kitchenCloses} swaps={d.tonight.swaps}
            plan={d.tonight.plan} evening={d.evening} onLog={self ? logEvening : undefined} />
        )}

        {adult && <ProteinCard date={date} self={self} viewUser={viewUser} />}

        <Habits d={d} date={date} self={self} onChange={(hw) => setD((x) => (x ? { ...x, habitWeek: hw } : x))} reload={load} />

        {adult && <p className="small muted" style={{ textAlign: "center" }}>General guidance, not medical advice — your doctor leads on A1C and medications.</p>}

        {sheet && (
          <div className="sheet-backdrop" onClick={() => setSheet(false)}>
            <div className="sheet" onClick={(e) => e.stopPropagation()} role="dialog" aria-label="Check in">
              <CheckInForm athlete={d.profileKind === "athlete"} date={date} initial={d.checkIn}
                onSaved={() => { setSheet(false); load(); }} onCancel={() => setSheet(false)} />
            </div>
          </div>
        )}
      </>)}
    </main>
  );
}

function Habits({ d, date, self, onChange, reload }: { d: TodayRes; date: string; self: boolean; onChange: (hw: Record<string, string[]>) => void; reload: () => void }) {
  const [adding, setAdding] = useState(false);
  const [txt, setTxt] = useState("");
  const [editing, setEditing] = useState(false);
  const done = d.habitWeek[date] ?? [];
  const list = d.habitList;
  const count = list.filter((h) => done.includes(h.name)).length;
  async function toggle(name: string, on: boolean) {
    const next = { ...d.habitWeek, [date]: on ? [...done, name] : done.filter((x) => x !== name) };
    onChange(next);
    await api("/api/habits", { body: { date, habit: name, done: on } }).catch(() => reload());
  }
  async function add(e: React.FormEvent) {
    e.preventDefault();
    if (!txt.trim()) return;
    await api("/api/habits", { body: { add: txt } });
    setTxt(""); setAdding(false); reload();
  }
  if (!list.length && !self) return null;
  return (
    <section className="card">
      <div className="row between">
        <span className="eyebrow">Daily habits</span>
        <span className="row" style={{ gap: 10 }}>
          {list.length > 0 && <b className={`small ${count === list.length ? "accent-text" : ""}`}>{count}/{list.length} today</b>}
          {self && list.some((h) => h.custom) && <button className="link small" onClick={() => setEditing(!editing)}>{editing ? "Done" : "Edit"}</button>}
        </span>
      </div>
      <ul className="habit-list">
        {list.map((h) => {
          const on = done.includes(h.name);
          return (
            <li key={h.name}>
              <label>
                <input type="checkbox" checked={on} disabled={!self} onChange={(e) => toggle(h.name, e.target.checked)} />
                <span className="habit-name">{h.name}</span>
                {editing && h.custom ? (
                  <button className="link danger-text small" onClick={async (e) => { e.preventDefault(); await api("/api/habits", { body: { remove: h.name } }); reload(); }}>Remove</button>
                ) : (
                  <span className="habit-dots" aria-label={`${h.name}: ${d.weekStrip.filter((x) => d.habitWeek[x.date]?.includes(h.name)).length} of 7 days this week`}>
                    {d.weekStrip.map((x) => <i key={x.date} className={`${d.habitWeek[x.date]?.includes(h.name) ? "on" : ""} ${x.date > localDate() ? "future" : ""}`} />)}
                  </span>
                )}
              </label>
            </li>
          );
        })}
      </ul>
      {self && (adding ? (
        <form className="row" style={{ flexWrap: "nowrap", marginTop: 10 }} onSubmit={add}>
          <input autoFocus placeholder="e.g. 8,000 steps, 64 oz water" value={txt} onChange={(e) => setTxt(e.target.value)} />
          <button type="submit" className="primary" disabled={!txt.trim()}>Add</button>
        </form>
      ) : <button className="link small" style={{ marginTop: 8 }} onClick={() => setAdding(true)}>+ Add a habit</button>)}
      {d.nutrition && <p className="small" style={{ marginBottom: 0 }}><b>{d.nutrition.calories.toLocaleString()} cal · {d.nutrition.proteinG}g protein.</b> <span className="muted">{d.nutrition.carbApproach}</span></p>}
      {d.fueling && <p className="small" style={{ marginBottom: 0 }}><b>Fuel:</b> <span className="muted">{d.fueling}</span></p>}
    </section>
  );
}

function PlanCard({ d, date, self }: { d: TodayRes; date: string; self: boolean }) {
  const [info, setInfo] = useState<number | null>(null);
  const r = d.readiness;
  const done = d.workoutsToday;
  if (done.length) return (
    <section className="hero">
      <div className="eyebrow hero-eyebrow">Today · done</div>
      {done.map((w) => (
        <Link key={w.id} href={`/history/${w.id}${self ? "" : `?user=${d.user.id}`}`} className="done-row">
          <b className="display" style={{ fontSize: 24 }}>{w.name} ✓</b>
          <span className="small muted">{w.sets} set{w.sets === 1 ? "" : "s"}{w.volume ? ` · ${w.volume.toLocaleString()} lb` : ""}{w.prs ? ` · ${w.prs} new record${w.prs > 1 ? "s" : ""}` : ""}{w.watch ? " · Watch data" : ""}</span>
        </Link>
      ))}
    </section>
  );
  if (d.startDate && date < d.startDate) {
    const days = Math.round((Date.parse(`${d.startDate}T12:00:00`) - Date.parse(`${date}T12:00:00`)) / 86400000);
    return (
      <section className="hero">
        <div className="eyebrow hero-eyebrow">{days} day{days === 1 ? "" : "s"} to go</div>
        <h2 className="hero-title">{d.slotNote}</h2>
        <p className="small muted">{d.profileKind === "adult" ? "Start the habits now: post-dinner walk and your evening swap." : "Rest up, and get your gear ready for Test Day."}</p>
        {self && <Link href="/routines" className="small">Change start date</Link>}
      </section>
    );
  }
  if (!d.routine) return (
    <section className="hero">
      <div className="eyebrow hero-eyebrow">Today</div>
      <h2 className="hero-title">{d.slotNote ?? "Rest day"}</h2>
      <p className="small muted">Recovery is part of the plan. {d.profileKind === "adult" ? "Still take your post-dinner walk." : "Sleep, eat well, light mobility if you like."}</p>
      {self && <button className="big wide" onClick={() => startWorkout(null, date)}>Log something anyway</button>}
    </section>
  );
  const rt = d.routine;
  return (
    <section className="hero">
      <div className="row between hero-eyebrow">
        <span className="eyebrow">Today{d.program?.week ? ` · Week ${Math.min(d.program.week, d.program.blockWeeks)}` : ""}{d.program?.weekInfo?.deload ? " · lighter" : ""}</span>
        <span className="eyebrow">~{rt.estMinutes} min</span>
      </div>
      <h2 className="hero-title">{rt.name}</h2>
      <p className="small muted" style={{ margin: "0 0 12px" }}>{rt.purpose}</p>
      {r && (r.reasons.length > 0 || r.removed.length > 0) && (
        <p className="small why"><b>{STATUS[r.status]}:</b> {r.reasons.join(", ")}.
          {r.removed.length > 0 && ` Removed: ${r.removed.map((x) => getExercise(x.exerciseId)?.name).join(", ")}.`}
          {r.dropOneSet && " One less set on each exercise."}</p>
      )}
      <div className="chips" style={{ marginBottom: 14 }}>
        {rt.exercises.map((e, i) => <button key={i} className="chip hero-chip" onClick={() => setInfo(i)}>{e.superset && <b style={{ color: "var(--accent)" }}>{e.superset} </b>}{getExercise(e.exerciseId)?.name}</button>)}
      </div>
      {info !== null && rt.exercises[info] && (
        <ExerciseSheet id={rt.exercises[info].exerciseId} onClose={() => setInfo(null)}
          extra={<div className="rx">{rxParts(rt.exercises[info]).map((x) => <span key={x.label} className={x.weight ? "w" : ""}>{x.label}</span>)}</div>} />
      )}
      {self && <button className="primary big wide row" style={{ justifyContent: "center", gap: 8 }} onClick={() => startWorkout(rt, date, !!d.program?.weekInfo?.deload)}><IconPlay size={18} />Start workout</button>}
    </section>
  );
}

function CheckInForm({ athlete, date, initial, onSaved, onCancel }: { athlete: boolean; date: string; initial: CheckIn | null; onSaved: () => void; onCancel?: () => void }) {
  const [c, setC] = useState<Partial<CheckIn> & { weightLb?: number }>(initial ?? { pain: false, sleepHours: 7 });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const set = (p: Partial<typeof c>) => setC((x) => ({ ...x, ...p }));

  async function submit() {
    setBusy(true); setErr("");
    try { await api("/api/checkin", { body: { ...c, date } }); onSaved(); }
    catch (e) { setErr((e as Error).message); setBusy(false); }
  }
  return (
    <div>
      <div className="row between"><h2 style={{ margin: 0 }}>Check in</h2>{onCancel && <button className="link" aria-label="Close" onClick={onCancel}><IconClose /></button>}</div>
      <div style={{ height: 12 }} />
      <Field label="Sleep last night"><Stepper value={c.sleepHours ?? null} onChange={(v) => set({ sleepHours: v ?? undefined })} step={0.5} decimals={1} min={0} max={14} unit="hrs" /></Field>
      <Field label="Energy"><Scale value={c.energy} onChange={(n) => set({ energy: n })} low="Wiped" high="Great" /></Field>
      <Field label="Soreness"><Scale value={c.soreness} onChange={(n) => set({ soreness: n })} low="None" high="Very sore" /></Field>
      {athlete && <Field label="Mood"><Scale value={c.mood} onChange={(n) => set({ mood: n })} low="Low" high="Great" /></Field>}
      {athlete && <Field label="Stress"><Scale value={c.stress} onChange={(n) => set({ stress: n })} low="Calm" high="Very stressed" /></Field>}
      {!athlete && <Field label="Morning weight (optional)"><Stepper value={c.weightLb ?? null} onChange={(v) => set({ weightLb: v ?? undefined })} step={0.2} decimals={1} min={50} max={600} unit="lb" /></Field>}
      <Field label="Anything hurt — not just sore?">
        <Segmented options={["no", "yes"]} value={c.pain ? "yes" : "no"} onChange={(v) => set({ pain: v === "yes" })} labels={{ no: "No", yes: "Yes" }} />
      </Field>
      {c.pain && (<div className="pain-box">
        <Field label="Where?"><Chips options={REGIONS} value={c.painRegion ?? null} onChange={(v) => set({ painRegion: v as Region })} /></Field>
        <Field label="Side"><Segmented options={["left", "right", "both"] as const} value={c.painSide ?? null} onChange={(v) => set({ painSide: v })} labels={{ left: "Left", right: "Right", both: "Both / middle" }} /></Field>
        <Field label="How bad? (0–10)"><Chips options={["1", "2", "3", "4", "5", "6", "7", "8", "9", "10"]} value={c.painLevel != null ? String(c.painLevel) : null} onChange={(v) => set({ painLevel: Number(v) })} /></Field>
        <Field label="Feels"><Segmented options={["achy", "sharp"] as const} value={c.painQuality ?? null} onChange={(v) => set({ painQuality: v })} labels={{ achy: "Achy / dull", sharp: "Sharp" }} /></Field>
        {athlete && <Field label="Does it hurt when you throw?"><Segmented options={["no", "yes"]} value={c.painWithThrowing ? "yes" : "no"} onChange={(v) => set({ painWithThrowing: v === "yes" })} labels={{ no: "No", yes: "Yes" }} /></Field>}
      </div>)}
      <Field label={athlete ? "Any of these? (rare — tap only if true)" : "Any of these today?"}>
        <Chips multi options={athlete ? ATHLETE_RED_FLAGS : ADULT_SYMPTOMS} value={(athlete ? c.redFlags : c.symptoms) ?? []}
          onChange={(v) => set(athlete ? { redFlags: v as string[] } : { symptoms: v as string[] })} />
      </Field>
      <Field label="Note (private)"><input value={c.note ?? ""} onChange={(e) => set({ note: e.target.value })} placeholder={athlete ? "Lesson cues, how practice went…" : "Anything worth remembering"} /></Field>
      {err && <p className="error">{err}</p>}
      <button className="primary wide" onClick={submit} disabled={busy || (c.pain && !c.painRegion)}>{busy ? "Saving…" : "Save check-in"}</button>
    </div>
  );
}

function CheckInSummary({ c, r, athlete, onEdit }: { c: CheckIn; r: Readiness | null; athlete: boolean; onEdit?: () => void }) {
  const stats: [string, string | number | undefined][] = [
    ["Sleep", c.sleepHours != null ? `${c.sleepHours}h` : undefined], ["Energy", c.energy], ["Sore", c.soreness],
    ...(athlete ? ([["Mood", c.mood]] as [string, number | undefined][]) : []),
  ];
  return (
    <div className="card">
      <div className="row between"><h2 style={{ margin: 0 }}>Check-in <span className={`pill ${r?.status ?? "green"}`} style={{ marginLeft: 6 }}>{r?.status === "red" ? "Recovery" : r?.status === "yellow" ? "Take it easier" : "Ready"}</span></h2>{onEdit && <button className="link" onClick={onEdit}>Edit</button>}</div>
      <div className="stats" style={{ marginTop: 10 }}>{stats.map(([k, v]) => <div className="stat" key={k}><b>{v ?? "–"}</b>{k}</div>)}</div>
      {c.pain && <p className="warn small" style={{ marginTop: 10 }}><b>Pain:</b> {c.painRegion} {c.painSide ?? ""} {c.painLevel ?? "?"}/10 {c.painQuality ?? ""}{c.painWithThrowing ? ", with throwing" : ""}</p>}
      {c.note && <p className="small muted">{c.note}</p>}
    </div>
  );
}
