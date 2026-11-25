"use client";
import Link from "next/link";
import BackButton from "./BackButton";
import { useCallback, useEffect, useState } from "react";
import { api, localDate } from "@/lib/client";
import { WALK } from "@/lib/walk";
import { getExercise, type Region } from "@/lib/exercises";
import { ADULT_SYMPTOMS, ATHLETE_RED_FLAGS, type Readiness } from "@/lib/rules";
import type { Routine } from "@/lib/schemas";
import type { CheckIn, EveningLog, WorkoutSummary } from "@/lib/types";
import { startWorkout } from "@/lib/workout-client";
import { openLog } from "./LogSheet";
import { IconChat, IconCheck, IconChevron, IconClose, IconPlay } from "./icons";
import FoodCard, { foodStatus, useFoodView } from "./FoodCard";
import { ReviewChip, ReviewSheet, useReview } from "./ReviewCard";
import type { ChatLine } from "@/lib/chat";
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
  walked: boolean;
  weekStrip: { date: string; dow: number; routine: string | null; done: boolean }[];
  workoutsToday: WorkoutSummary[];
};

const REGIONS: Region[] = ["shoulder", "elbow", "wrist", "back", "hip", "knee", "ankle", "neck"];
const D = ["S", "M", "T", "W", "T", "F", "S"];
const STATUS = { green: "Ready", yellow: "Adjusted", red: "Recovery" } as const;
const EVENING: Record<string, string> = { plan: "As planned", bit: "Snacked a bit", off: "Off plan" };
const greeting = () => { const h = new Date().getHours(); return h < 12 ? "Morning" : h < 17 ? "Afternoon" : "Evening"; };

type RowId = "checkin" | "workout" | "food" | "tonight";

export default function Today({ viewUser }: { viewUser: string | null }) {
  const [date, setDate] = useState(localDate());
  const [d, setD] = useState<TodayRes | null>(null);
  const [err, setErr] = useState("");
  const [sheet, setSheet] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [open, setOpen] = useState<RowId | null>(null);
  const [ciSkip, setCiSkip] = useState(false);
  const [coach, setCoach] = useState<ChatLine | null>(null);

  const load = useCallback(async () => {
    setErr("");
    try { setD(await api<TodayRes>(`/api/today?date=${date}${viewUser ? `&user=${viewUser}` : ""}`)); }
    catch (e) { setErr((e as Error).message); }
  }, [date, viewUser]);
  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    if (q.get("checkin") === "1" && !viewUser) { setSheet(true); window.history.replaceState(null, "", "/today"); }
    try { setCiSkip(sessionStorage.getItem(`ft-ci-skip-${localDate()}`) === "1"); } catch {}
  }, [viewUser]);

  const isToday = date === localDate();
  const self = d?.user.self ?? !viewUser;
  const r = d?.readiness;
  const adult = d?.profileKind === "adult";
  const review = useReview(date, !!d?.hasProgram && self && isToday);
  const food = useFoodView(date, viewUser, !!d && adult);
  useEffect(() => {
    if (!d || !self || !isToday) { setCoach(null); return; }
    api<{ latest: ChatLine | null }>("/api/chat?latest=1").then((x) => setCoach(x.latest && x.latest.kind !== "review" && new Date(x.latest.at).toDateString() === new Date().toDateString() ? x.latest : null), () => {});
  }, [d, self, isToday]);

  async function logWalk(on: boolean) {
    setD((x) => (x ? { ...x, walked: on } : x));
    try { await api("/api/habits", { body: { date, habit: WALK, done: on } }); if (!on) await api("/api/habits", { body: { date, habit: "10–15 min walk after dinner", done: false } }); }
    catch (e) { setErr((e as Error).message); load(); }
  }
  async function logEvening(v: EveningLog) {
    setD((x) => (x ? { ...x, evening: v } : x));
    try { await api("/api/evening", { body: { date, value: v } }); load(); } catch (e) { setErr((e as Error).message); }
  }

  const dateLabel = new Date(`${date}T12:00:00`).toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
  const header = (
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
  );
  if (!d || !d.hasProgram) return (
    <main>
      {viewUser && <BackButton fallback="/family" />}
      {header}
      {err && <p className="error">{err}</p>}
      {!d && !err && <p className="muted"><span className="spinner" />Loading…</p>}
      {d && <div className="card"><h2>{self ? "Let's set you up" : `${d.user.name} hasn't finished setup`}</h2>{self && <Link href="/onboarding">Start setup →</Link>}</div>}
    </main>
  );

  // ---- what's done, and what's next ----
  const workoutDone = d.workoutsToday.length > 0;
  const preStart = !!d.startDate && date < d.startDate;
  const hasWorkout = !!d.routine && !preStart;
  const fs = foodStatus(food[0]);
  const hour = new Date().getHours();
  let next: RowId | "done" | null = null;
  if (isToday) {
    if (self && !d.checkIn && !ciSkip) next = "checkin";
    else if (hasWorkout && !workoutDone) next = "workout";
    else if (adult && d.tonight && hour >= 16 && (!d.evening || !d.walked)) next = "tonight";
    else if (adult && food[0] && fs.state !== "done") next = "food";
    else if (adult && d.tonight && (!d.evening || !d.walked)) next = "tonight";
    else next = "done";
  } else if (hasWorkout && !workoutDone) next = "workout";

  const planCard = <PlanCard d={d} date={date} self={self} />;
  const tonightCard = d.tonight ? <TonightCard collapsible={next !== "tonight"} dinner={d.dinner} tvTime={d.tonight.tvTime} kitchenCloses={d.tonight.kitchenCloses} swaps={d.tonight.swaps}
    plan={d.tonight.plan} evening={d.evening} onLog={self ? logEvening : undefined} walked={d.walked} onWalk={self ? logWalk : undefined} /> : null;
  const foodCard = <FoodCard date={date} self={self} viewUser={viewUser} mode="summary" data={food} />;
  const body: Record<RowId, React.ReactNode> = {
    checkin: d.checkIn ? <CheckInSummary c={d.checkIn} r={r ?? null} athlete={!adult} onEdit={self ? () => setSheet(true) : undefined} /> : <p className="muted small" style={{ margin: 0 }}>No check-in yet.</p>,
    workout: planCard, food: foodCard, tonight: tonightCard,
  };

  type Row = { id: RowId; title: string; value: string; state: "done" | "part" | "todo" | "rest" };
  const rows: Row[] = [
    { id: "checkin", title: "Check in", value: d.checkIn ? STATUS[r?.status ?? "green"] : self ? "30 sec" : "Not yet", state: d.checkIn ? "done" : "todo" },
    { id: "workout", title: "Workout", state: workoutDone ? "done" : hasWorkout ? "todo" : "rest",
      value: workoutDone ? d.workoutsToday.map((w) => w.name).join(", ") : hasWorkout ? `${d.routine!.name} · ~${d.routine!.estMinutes} min` : preStart ? "Program hasn't started" : d.slotNote ?? "Rest day" },
    ...(adult ? [{ id: "food" as const, title: "Food", value: food[0] ? fs.text : "…", state: fs.state }] : []),
    ...(d.tonight ? [{ id: "tonight" as const, title: "Tonight", state: (d.evening && d.walked ? "done" : d.evening || d.walked ? "part" : "todo") as Row["state"],
      value: [d.walked && "Walked", d.evening ? EVENING[d.evening] ?? "Logged" : null].filter(Boolean).join(" · ") || (d.dinner ? d.dinner.title : "No dinner planned") }] : []),
  ];

  // Tapping a circle is the quickest way to finish that item; it still only fills once the real thing is logged.
  const quick: Partial<Record<RowId, { label: string; run: () => void }>> = !self ? {} : {
    checkin: { label: d.checkIn ? "Edit check-in" : "Check in now", run: () => setSheet(true) },
    ...(workoutDone ? {} : { workout: { label: "Log today's workout as already done", run: () => startWorkout(hasWorkout ? d.routine : null, date, !!d.program?.weekInfo?.deload, true) } }),
    ...(adult && isToday ? { food: { label: "Log food", run: () => openLog("food") } } : {}),
    ...(d.tonight ? { tonight: { label: d.walked ? "Undo walk after dinner" : "Mark walk after dinner done", run: () => logWalk(!d.walked) } } : {}),
  };
  const tap = (id: RowId) => {
    if (id === "checkin" && self && !d.checkIn) return setSheet(true);
    if (id === next) return window.scrollTo({ top: 0, behavior: "smooth" });
    setOpen(open === id ? null : id);
  };
  const coachText = coach?.text ?? (review ? review.advice?.[0] ?? review.todayFocus?.[0] : null);

  return (
    <main>
      {viewUser && <BackButton fallback="/family" />}
      {header}
      {err && <p className="error">{err}</p>}

      <div className="status-strip">
        {self && isToday && <ReviewChip r={review} onOpen={() => setReportOpen(true)} />}
        {adult && food[0] && (
          <button className="status-chip" onClick={() => { setOpen("food"); setTimeout(() => document.getElementById("row-food")?.scrollIntoView({ behavior: "smooth", block: "start" }), 50); }}>
            <b>{food[0].totals.protein}</b><span>/{food[0].targets.proteinG} g protein</span>
          </button>
        )}
        <Link href={viewUser ? `/progress?user=${viewUser}` : "/progress"} className="status-chip">
          <b>{d.weekStats.done}/{d.weekStats.planned}</b> workouts{d.weekStats.activeMin ? <> · <b>{d.weekStats.activeMin}</b> min</> : null}
        </Link>
      </div>

      <div className="day-dots" style={{ marginTop: 0, marginBottom: 14 }}>
        {d.weekStrip.map((x) => (
          <button key={x.date} onClick={() => { setDate(x.date); setOpen(null); }} className={`${x.date === date ? "sel" : ""} ${x.done ? "done" : x.routine ? "train" : ""}`}
            aria-label={`${x.date}${x.routine ? `: ${x.routine}` : ""}${x.done ? ", done" : ""}`}>
            <span>{D[x.dow]}</span><i />
          </button>
        ))}
      </div>

      {r?.urgent && <div className="card urgent"><b>Stop.</b> {r.urgent}</div>}

      {next && <div className="section-label">{next === "done" ? "Today" : "Up next"}</div>}
      {next === "checkin" && (
        <section className="hero">
          <h2 className="hero-title">Check in</h2>
          <p className="small muted" style={{ margin: "0 0 14px" }}>30 seconds — sleep, energy, soreness. It sets today&apos;s {hasWorkout ? `${d.routine!.name} ` : "plan "}to how you actually feel.</p>
          <button className="primary big wide" onClick={() => setSheet(true)}>Check in</button>
          <button className="link small" style={{ display: "block", margin: "10px auto 0" }} onClick={() => { setCiSkip(true); try { sessionStorage.setItem(`ft-ci-skip-${date}`, "1"); } catch {} }}>Skip for now</button>
        </section>
      )}
      {next === "workout" && planCard}
      {next === "tonight" && tonightCard}
      {next === "food" && foodCard}
      {next === "done" && (
        <section className="hero">
          <h2 className="hero-title">All done today ✓</h2>
          <p className="small muted" style={{ margin: 0 }}>{workoutDone ? `${d.workoutsToday.map((w) => w.name).join(" + ")} logged. ` : ""}{adult && food[0] ? `${food[0].totals.protein} g protein. ` : ""}Rest up — tomorrow builds on today.</p>
        </section>
      )}

      {coachText && self && isToday && (
        <Link href="/coach" className="coach-line">
          <IconChat size={18} />
          <span><b>Coach</b> {coachText}</span>
          <IconChevron size={16} />
        </Link>
      )}

      <div className="section-label">{isToday ? "Today" : dateLabel}</div>
      <section className="today-list">
        {rows.map((row) => (
          <div key={row.id} id={`row-${row.id}`} className={`trow-wrap ${open === row.id ? "open" : ""}`}>
            <div className="trow">
              {quick[row.id]
                ? <button className={`trow-icon ${row.state}`} onClick={quick[row.id]!.run} aria-label={quick[row.id]!.label}>{row.state === "done" ? <IconCheck size={14} /> : null}</button>
                : <span className={`trow-icon ${row.state}`} aria-hidden>{row.state === "done" ? <IconCheck size={14} /> : null}</span>}
              <button className="trow-main" onClick={() => tap(row.id)} aria-expanded={open === row.id}>
                <span className="trow-title">{row.title}</span>
                <span className="trow-value">{row.id === next ? <span className="accent-text">Up next ↑</span> : row.value}</span>
                {row.id !== next && <span className={`trow-chev ${open === row.id ? "rot" : ""}`}><IconChevron size={16} /></span>}
              </button>
            </div>
            {open === row.id && row.id !== next && <div className="trow-body">{body[row.id]}</div>}
          </div>
        ))}
      </section>

      {adult && <p className="small muted" style={{ textAlign: "center" }}>General guidance, not medical advice — your doctor leads on A1C and medications.</p>}

      {reportOpen && review && <ReviewSheet r={review} onClose={() => setReportOpen(false)} />}
      {sheet && (
        <div className="sheet-backdrop" onClick={() => setSheet(false)}>
          <div className="sheet" onClick={(e) => e.stopPropagation()} role="dialog" aria-label="Check in">
            <CheckInForm athlete={!adult} date={date} initial={d.checkIn}
              onSaved={() => { setSheet(false); load(); }} onCancel={() => setSheet(false)} />
          </div>
        </div>
      )}
    </main>
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
      {d.fueling && <p className="small" style={{ margin: "12px 0 0" }}><b>Fuel:</b> <span className="muted">{d.fueling}</span></p>}
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
