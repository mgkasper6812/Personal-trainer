"use client";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { api, localDate } from "@/lib/client";
import { getExercise, type Region } from "@/lib/exercises";
import { ADULT_SYMPTOMS, ATHLETE_RED_FLAGS, type Readiness } from "@/lib/rules";
import type { Routine } from "@/lib/schemas";
import type { CheckIn, EveningLog, WorkoutSummary } from "@/lib/types";
import { loadActive, startWorkout } from "@/lib/workout-client";
import { Chips, Field, Scale, Segmented, Stepper } from "./ui";

type TodayRes = {
  user: { id: string; name: string; role: "parent" | "athlete"; self: boolean };
  date: string; weekday: string; hasProfile: boolean; hasProgram: boolean; profileKind: "adult" | "athlete" | null;
  program: { title: string; week: number; blockWeeks: number; weekInfo: { theme: string; deload: boolean } | null } | null;
  slotNote: string | null; startDate: string | null; routine: Routine | null; baseRoutineKey: string | null; readiness: Readiness | null;
  checkIn: CheckIn | null; evening: EveningLog | null;
  tonight: { tvTime: string; kitchenCloses: string | null; swaps: string[]; plan: string | null } | null;
  nutrition: { calories: number; proteinG: number; carbApproach: string } | null; fueling: string | null; habits: string[];
  weekStrip: { date: string; dow: number; routine: string | null; done: boolean }[];
  workoutsToday: WorkoutSummary[];
};

const REGIONS: Region[] = ["shoulder", "elbow", "wrist", "back", "hip", "knee", "ankle", "neck"];
const D = ["S", "M", "T", "W", "T", "F", "S"];
const t12 = (t: string | null) => {
  if (!t) return "";
  const [h, m] = t.split(":").map(Number);
  return `${((h + 11) % 12) + 1}:${String(m).padStart(2, "0")}${h < 12 ? "am" : "pm"}`;
};

export default function Today({ viewUser }: { viewUser: string | null }) {
  const [date, setDate] = useState(localDate());
  const [d, setD] = useState<TodayRes | null>(null);
  const [err, setErr] = useState("");
  const [editing, setEditing] = useState(false);
  const [active, setActive] = useState<string | null>(null);

  const load = useCallback(async () => {
    setErr("");
    try { setD(await api<TodayRes>(`/api/today?date=${date}${viewUser ? `&user=${viewUser}` : ""}`)); }
    catch (e) { setErr((e as Error).message); }
  }, [date, viewUser]);
  useEffect(() => { setD(null); load(); setActive(loadActive()?.name ?? null); }, [load]);

  const isToday = date === localDate();
  const self = d?.user.self ?? !viewUser;
  const r = d?.readiness;

  async function logEvening(v: EveningLog) {
    setD((x) => (x ? { ...x, evening: v } : x));
    try { await api("/api/evening", { body: { date, value: v } }); } catch (e) { setErr((e as Error).message); }
  }

  return (
    <main>
      <div className="row between">
        <h1 style={{ margin: "4px 0" }}>{viewUser && d ? `${d.user.name} · ` : ""}{isToday ? "Today" : d?.weekday ?? "…"}</h1>
        {!isToday && <button className="link" onClick={() => setDate(localDate())}>Back to today</button>}
      </div>
      {d && (
        <div className="week-strip">
          {d.weekStrip.map((x) => (
            <button key={x.date} className={`${x.date === date ? "sel" : ""} ${x.done ? "done" : ""} ${x.routine ? "train" : ""}`} onClick={() => setDate(x.date)}>
              <span>{D[x.dow]}</span><b>{Number(x.date.slice(8))}</b><i />
            </button>
          ))}
        </div>
      )}
      {viewUser && d && <p className="warn small">Viewing {d.user.name}&apos;s day (read-only).</p>}
      {err && <p className="error">{err}</p>}
      {!d && !err && <p className="muted"><span className="spinner" />Loading…</p>}

      {d && !d.hasProgram && (
        <div className="card"><h2>{self ? "Let's set you up" : `${d.user.name} hasn't finished setup`}</h2>{self && <Link href="/onboarding">Start setup →</Link>}</div>
      )}

      {d?.hasProgram && (<>
        {self && active && <Link href="/workout" className="resume">▶ Resume “{active}”</Link>}
        {r?.urgent && <div className="card urgent"><b>Stop.</b> {r.urgent}</div>}

        {self && (!d.checkIn || editing) ? (
          <CheckInForm athlete={d.profileKind === "athlete"} date={date} initial={d.checkIn}
            onSaved={() => { setEditing(false); load(); }} onCancel={d.checkIn ? () => setEditing(false) : undefined} />
        ) : d.checkIn ? (
          <CheckInSummary c={d.checkIn} r={r ?? null} athlete={d.profileKind === "athlete"} onEdit={self ? () => setEditing(true) : undefined} />
        ) : !self ? <p className="muted small">No check-in yet.</p> : null}

        <PlanCard d={d} date={date} self={self} />

        {d.tonight && (
          <div className="card tonight">
            <div className="row between"><h2 style={{ margin: 0 }}>🌙 Tonight</h2><span className="small muted">TV ~{t12(d.tonight.tvTime)}</span></div>
            {d.tonight.kitchenCloses && <p><b>Kitchen closes {t12(d.tonight.kitchenCloses)}.</b></p>}
            {d.tonight.swaps.length > 0 && <p>If you want a snack: <b>{d.tonight.swaps.join(" or ")}</b>.</p>}
            {d.tonight.plan && <p className="small muted">{d.tonight.plan}</p>}
            <p className="small">After dinner: 10–15 min walk — it blunts the blood-sugar spike.</p>
            {self && (<>
              <div className="field-label" style={{ marginTop: 10 }}>How did the evening go?</div>
              <Segmented options={["plan", "bit", "off"] as const} value={d.evening} onChange={logEvening}
                labels={{ plan: "As planned", bit: "Snacked a bit", off: "Off plan" }} />
            </>)}
          </div>
        )}

        {(d.habits.length > 0 || d.nutrition || d.fueling) && (
          <div className="card">
            <h2>Daily habits</h2>
            <ul className="small">{d.habits.map((h) => <li key={h}>{h}</li>)}</ul>
            {d.nutrition && <p className="small"><b>{d.nutrition.calories.toLocaleString()} cal · {d.nutrition.proteinG}g protein.</b> {d.nutrition.carbApproach}</p>}
            {d.fueling && <p className="small"><b>Fuel:</b> {d.fueling}</p>}
          </div>
        )}
        {d.profileKind === "adult" && <p className="small muted" style={{ textAlign: "center" }}>General guidance, not medical advice — your doctor leads on A1C and medications.</p>}
      </>)}
    </main>
  );
}

function PlanCard({ d, date, self }: { d: TodayRes; date: string; self: boolean }) {
  const r = d.readiness;
  const done = d.workoutsToday;
  if (done.length) return (
    <div className="card">
      <span className="pill green">Done</span>
      {done.map((w) => (
        <Link key={w.id} href={`/history/${w.id}${self ? "" : `?user=${d.user.id}`}`} className="done-row">
          <b>{w.name}</b><span className="small muted">{w.sets} sets{w.volume ? ` · ${w.volume.toLocaleString()} lb` : ""}{w.prs ? ` · 🏆 ${w.prs} PR` : ""}{w.watch ? " · ⌚" : ""}</span>
        </Link>
      ))}
    </div>
  );
  if (d.startDate && date < d.startDate) {
    const days = Math.round((Date.parse(`${d.startDate}T12:00:00`) - Date.parse(`${date}T12:00:00`)) / 86400000);
    return (
      <div className="card">
        <h2>{d.slotNote}</h2>
        <p className="small muted">{days} day{days === 1 ? "" : "s"} to go. {d.profileKind === "adult" ? "Start the habits now: post-dinner walk and your evening swap." : "Rest up, and get your gear ready for Test Day."}</p>
        {self && <Link href="/routines" className="small">Change start date</Link>}
      </div>
    );
  }
  if (!d.routine) return (
    <div className="card">
      <h2>{d.slotNote ?? "Rest day"}</h2>
      <p className="small muted">Recovery is part of the plan. {d.profileKind === "adult" ? "Still take your post-dinner walk." : "Sleep, eat well, light mobility if you like."}</p>
      {self && <button className="link" onClick={() => startWorkout(null, date)}>Log something anyway →</button>}
    </div>
  );
  const rt = d.routine;
  return (
    <div className="card">
      <div className="row between">
        <span className={`pill ${r?.status ?? "green"}`}>{r?.status === "red" ? "Recovery" : r?.status === "yellow" ? "Adjusted" : "Go"}</span>
        <span className="small muted">{d.program?.week ? `Week ${Math.min(d.program.week, d.program.blockWeeks)} of ${d.program.blockWeeks}` : ""}{d.program?.weekInfo?.deload ? " · lighter week" : ""}</span>
      </div>
      <h2 style={{ margin: "10px 0 4px" }}>{rt.name}</h2>
      <p className="small" style={{ marginTop: 0 }}>{rt.purpose} · ~{rt.estMinutes} min</p>
      {r && (r.reasons.length > 0 || r.removed.length > 0) && (
        <p className="small why"><b>Why it changed:</b> {r.reasons.join(", ")}.
          {r.removed.length > 0 && ` Removed: ${r.removed.map((x) => getExercise(x.exerciseId)?.name).join(", ")}.`}
          {r.dropOneSet && " One less set on each exercise."}</p>
      )}
      <ul className="ex-list">
        {rt.exercises.map((e, i) => {
          const ex = getExercise(e.exerciseId);
          const tgt = e.repsMin ? `${e.sets} × ${e.repsMin}${e.repsMax && e.repsMax !== e.repsMin ? `–${e.repsMax}` : ""}`
            : e.seconds ? `${e.sets} × ${e.seconds}s` : e.minutes ? `${e.minutes} min` : e.count ? `${e.sets} × ${e.count}` : `${e.sets} sets`;
          return <li key={i}><span>{e.superset && <b className="ss">{e.superset}</b>}{ex?.name}</span><span className="muted">{tgt}</span></li>;
        })}
      </ul>
      {self && <button className="primary wide" onClick={() => startWorkout(rt, date, !!d.program?.weekInfo?.deload)}>Start workout</button>}
    </div>
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
    <div className="card">
      <div className="row between"><h2 style={{ margin: 0 }}>30-second check-in</h2>{onCancel && <button className="link" onClick={onCancel}>Cancel</button>}</div>
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
