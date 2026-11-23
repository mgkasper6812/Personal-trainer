"use client";
import { useState } from "react";
import BackButton from "./BackButton";
import { api, localDate } from "@/lib/client";
import type { Region } from "@/lib/exercises";
import type { AdultProfile, AthleteProfile, Profile } from "@/lib/types";
import { Chips, Field, Segmented, Stepper } from "./ui";

const REGIONS: Region[] = ["shoulder", "elbow", "wrist", "back", "hip", "knee", "ankle", "neck"];
const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;

const ADULT_DEFAULT: AdultProfile = {
  kind: "adult", goals: ["Lose weight", "Improve blood sugar"], pace: "steady", sex: "male", age: 45, heightIn: 70, weightLb: 230,
  targetWeightLb: null, glucoseStatus: "not_sure", a1c: null, meds: [], conditions: [], toughestTime: "Late-night TV", tvTime: "20:00",
  snacks: [], snackFrequency: "most", eveningSwaps: [], kitchenCloses: "20:30", trackingStyle: "evenings", dinners: ["Home-cooked"],
  daysPerWeek: 4, minutes: 30, busyDays: [], cardioDay: null, equipment: ["Dumbbells"], experience: "returning", limitations: [], avoid: "", devices: ["Apple Watch"],
  tone: "direct", proactive: "important", notes: "",
};
const ATHLETE_DEFAULT: AthleteProfile = {
  kind: "athlete", position: "CF", secondary: [], bats: "R", throws: "R", slapper: false, gradYear: 2028,
  priorities: ["Bat speed / exit velo", "Strength", "First step / speed", "Agility", "Arm"], events: [], practiceDays: [], lessonDays: [],
  daysPerWeek: 4, minutes: 60, gear: [], liftingBackground: "team", comfortableLifts: [], supervised: false, numbers: {},
  homeToFirstMethod: null, hittingFocus: [], hittingCues: "", pastInjuries: [], painNow: false, tone: "direct", proactive: "important", notes: "",
};

type Step<P> = { title: string; sub?: string; render: (p: P, set: (patch: Partial<P>) => void) => React.ReactNode };

const time = (v: string | null, on: (v: string) => void) => (
  <input type="time" value={v ?? ""} onChange={(e) => on(e.target.value)} style={{ maxWidth: 180 }} />
);

const adultSteps: Step<AdultProfile>[] = [
  { title: "What do you want out of this?", render: (p, set) => (<>
    <Field label="Goals (pick any)"><Chips multi options={["Lose weight", "Improve blood sugar", "More energy", "Get stronger", "Sleep better"]} value={p.goals} onChange={(v) => set({ goals: v as string[] })} /></Field>
    <Field label="Pace" hint="Steady ≈ 1 lb/week. The first milestone is 5–7% of your weight — the amount shown to cut diabetes risk by about half.">
      <Segmented options={["gentle", "steady", "faster"] as const} value={p.pace} onChange={(v) => set({ pace: v })} labels={{ gentle: "Gentle", steady: "Steady", faster: "Faster" }} />
    </Field>
  </>) },
  { title: "Body basics", render: (p, set) => (<>
    <Field label="Sex"><Segmented options={["male", "female"] as const} value={p.sex} onChange={(v) => set({ sex: v })} labels={{ male: "Male", female: "Female" }} /></Field>
    <Field label="Age"><Stepper value={p.age || null} onChange={(v) => set({ age: v ?? 0 })} min={18} max={100} unit="yrs" /></Field>
    <Field label="Height">
      <div className="row" style={{ gap: 16 }}>
        <Stepper value={Math.floor(p.heightIn / 12)} onChange={(v) => set({ heightIn: (v ?? 5) * 12 + (p.heightIn % 12) })} min={4} max={7} unit="ft" />
        <Stepper value={p.heightIn % 12} onChange={(v) => set({ heightIn: Math.floor(p.heightIn / 12) * 12 + Math.min(11, v ?? 0) })} min={0} max={11} unit="in" />
      </div>
    </Field>
    <Field label="Current weight"><Stepper value={p.weightLb || null} onChange={(v) => set({ weightLb: v ?? 0 })} min={80} max={600} step={0.2} decimals={1} unit="lb" /></Field>
    <Field label="Target weight (optional)" hint={p.weightLb ? `First milestone (5–7%): ${Math.round(p.weightLb * 0.93)}–${Math.round(p.weightLb * 0.95)} lb` : undefined}>
      <Stepper value={p.targetWeightLb} onChange={(v) => set({ targetWeightLb: v })} min={80} max={600} step={1} decimals={1} unit="lb" />
    </Field>
  </>) },
  { title: "Health context", sub: "So the coach follows the right guidance. Your doctor leads on medical decisions.", render: (p, set) => (<>
    <Field label="Blood sugar">
      <Chips options={["prediabetic", "insulin_resistant", "both", "neither", "not_sure"] as const} value={p.glucoseStatus} onChange={(v) => set({ glucoseStatus: v as AdultProfile["glucoseStatus"] })}
        labels={{ prediabetic: "Prediabetic", insulin_resistant: "Insulin resistant", both: "Both", neither: "Neither", not_sure: "Not sure" }} />
    </Field>
    <Field label="Last A1C (optional)"><Stepper value={p.a1c} onChange={(v) => set({ a1c: v })} step={0.1} decimals={1} min={4} max={14} unit="%" /></Field>
    <Field label="Medications that matter here"><Chips multi options={["None", "Metformin", "GLP-1", "Blood pressure", "Statin", "Other", "Prefer not to say"]} value={p.meds} onChange={(v) => set({ meds: v as string[] })} /></Field>
    <Field label="Other conditions"><Chips multi options={["High blood pressure", "High cholesterol", "Sleep apnea", "Heart condition", "None"]} value={p.conditions} onChange={(v) => set({ conditions: v as string[] })} /></Field>
  </>) },
  { title: "When is it hardest?", render: (p, set) => (<>
    <Field label="Toughest time of day"><Chips options={["Morning", "Lunch", "Afternoon", "After dinner", "Late-night TV"]} value={p.toughestTime} onChange={(v) => set({ toughestTime: v as string })} /></Field>
    <Field label="TV usually starts at">{time(p.tvTime, (v) => set({ tvTime: v }))}</Field>
  </>) },
  { title: "Evening snacks", render: (p, set) => (<>
    <Field label="What do you usually reach for?"><Chips multi options={["Popcorn", "Chips", "Fruit", "Sweets", "Ice cream", "Crackers / bread", "Cereal", "Nuts", "Cheese", "NA beer"]} value={p.snacks} onChange={(v) => set({ snacks: v as string[] })} /></Field>
    <Field label="How often?"><Segmented options={["rarely", "some", "most"] as const} value={p.snackFrequency} onChange={(v) => set({ snackFrequency: v })} labels={{ rarely: "Rarely", some: "2–3 nights", most: "Most nights" }} /></Field>
  </>) },
  { title: "Your evening plan", sub: "If-then swaps work far better than bans.", render: (p, set) => (<>
    <Field label="If I want a snack during TV, I'll…"><Chips multi options={["Greek yogurt", "Portioned popcorn", "Protein snack", "Fruit + nuts", "Herbal tea", "Sparkling water", "10-min walk", "Brush teeth"]} value={p.eveningSwaps} onChange={(v) => set({ eveningSwaps: v as string[] })} /></Field>
    <Field label="Kitchen closes at">{time(p.kitchenCloses, (v) => set({ kitchenCloses: v || null }))}</Field>
  </>) },
  { title: "Food tracking", render: (p, set) => (<>
    <Field label="How much do you want to track?">
      <Chips options={["plan_only", "evenings", "meals"] as const} value={p.trackingStyle} onChange={(v) => set({ trackingStyle: v as AdultProfile["trackingStyle"] })}
        labels={{ plan_only: "Just give me a plan", evenings: "Quick evening check only", meals: "Log meals" }} />
    </Field>
    <Field label="Dinners are usually…"><Chips multi options={["Home-cooked", "Shared cooking", "Takeout 1–2×/wk", "Eat out often"]} value={p.dinners} onChange={(v) => set({ dinners: v as string[] })} /></Field>
  </>) },
  { title: "Training setup", render: (p, set) => (<>
    <Field label="Days per week"><Segmented options={[2, 3, 4, 5, 6]} value={p.daysPerWeek} onChange={(v) => set({ daysPerWeek: v })} /></Field>
    <Field label="Minutes per session"><Segmented options={[10, 20, 30, 40]} value={p.minutes} onChange={(v) => set({ minutes: v })} /></Field>
    <Field label="Busy days (keep light or rest)"><Chips multi options={DAYS} value={(p.busyDays ?? []) as (typeof DAYS)[number][]} onChange={(v) => set({ busyDays: v as string[] })} /></Field>
    <Field label="Zone 2 cardio day" hint="An easy, steady 30–45 min session — great for blood sugar and heart health.">
      <Chips options={["None", ...DAYS] as const} value={p.cardioDay ?? "None"} onChange={(v) => set({ cardioDay: v === "None" ? null : (v as string) })} />
    </Field>
    <Field label="Equipment at home"><Chips multi options={["Dumbbells", "Kettlebell", "Bands", "Bench", "Pull-up bar", "Bike", "Treadmill", "None"]} value={p.equipment} onChange={(v) => set({ equipment: v as string[] })} /></Field>
    <Field label="Experience"><Segmented options={["new", "returning", "regular"] as const} value={p.experience} onChange={(v) => set({ experience: v })} labels={{ new: "New", returning: "Returning", regular: "Regular" }} /></Field>
    <Field label="Joints to protect"><Chips multi options={REGIONS} value={p.limitations} onChange={(v) => set({ limitations: v as Region[] })} /></Field>
    <Field label="Anything to avoid? (optional)"><input value={p.avoid} onChange={(e) => set({ avoid: e.target.value })} placeholder="e.g. no jumping, bad left knee" /></Field>
  </>) },
  { title: "Devices", render: (p, set) => (
    <Field label="What do you use?" hint="Apple Watch workouts and smart-scale weigh-ins sync through a quick iPhone Shortcut — set up later in Settings.">
      <Chips multi options={["Apple Watch", "Smart scale", "None"]} value={p.devices} onChange={(v) => set({ devices: v as string[] })} />
    </Field>
  ) },
  { title: "Your coach", render: (p, set) => (<>
    <Field label="Tone"><Segmented options={["direct", "encouraging"] as const} value={p.tone} onChange={(v) => set({ tone: v })} labels={{ direct: "Direct", encouraging: "Encouraging" }} /></Field>
    <Field label="Reminders"><Segmented options={["off", "important", "daily"] as const} value={p.proactive} onChange={(v) => set({ proactive: v })} labels={{ off: "Off", important: "Important only", daily: "Morning + pre-TV" }} /></Field>
    <Field label="Anything else the coach should know? (optional)"><textarea rows={3} value={p.notes} onChange={(e) => set({ notes: e.target.value })} /></Field>
  </>) },
];

const athleteSteps: Step<AthleteProfile>[] = [
  { title: "Welcome — here's what Dad sees", render: () => (
    <div className="card">
      <p><b>Dad sees:</b> pain alerts, which workouts you finished, and your test results (bat speed, sprint times, jumps).</p>
      <p><b>Private to you:</b> your check-in notes and mood.</p>
      <p className="muted small">Pain alerts exist so someone can help fast. Soreness is normal; pain isn&apos;t — always report it.</p>
    </div>
  ) },
  { title: "Player profile", render: (p, set) => (<>
    <Field label="Main position"><Chips options={["CF", "LF", "RF", "IF", "C", "P", "UT"]} value={p.position} onChange={(v) => set({ position: v as string })} /></Field>
    <Field label="Other positions"><Chips multi options={["CF", "LF", "RF", "1B", "2B", "SS", "3B", "C", "P"]} value={p.secondary} onChange={(v) => set({ secondary: v as string[] })} /></Field>
    <Field label="Bats"><Segmented options={["R", "L", "S"] as const} value={p.bats} onChange={(v) => set({ bats: v })} labels={{ R: "Right", L: "Left", S: "Switch" }} /></Field>
    <Field label="Throws"><Segmented options={["R", "L"] as const} value={p.throws} onChange={(v) => set({ throws: v })} labels={{ R: "Right", L: "Left" }} /></Field>
    <Field label="Slapper?"><Segmented options={["no", "yes"]} value={p.slapper ? "yes" : "no"} onChange={(v) => set({ slapper: v === "yes" })} labels={{ no: "No", yes: "Yes" }} /></Field>
    <Field label="Grad year"><Stepper value={p.gradYear} onChange={(v) => set({ gradYear: v ?? 2028 })} min={2025} max={2035} /></Field>
  </>) },
  { title: "What matters most?", sub: "Use the arrows to rank. The coach balances time from this and your test numbers.", render: (p, set) => (
    <div className="card" style={{ padding: 8 }}>
      {p.priorities.map((x, i) => (
        <div key={x} className="row between" style={{ padding: "8px 6px", borderBottom: i < p.priorities.length - 1 ? "1px solid var(--line)" : 0 }}>
          <span><b style={{ color: "var(--accent)", marginRight: 10 }}>{i + 1}</b>{x}</span>
          <span className="row" style={{ gap: 4 }}>
            <button type="button" disabled={i === 0} onClick={() => { const a = [...p.priorities]; [a[i - 1], a[i]] = [a[i], a[i - 1]]; set({ priorities: a }); }}>↑</button>
            <button type="button" disabled={i === p.priorities.length - 1} onClick={() => { const a = [...p.priorities]; [a[i + 1], a[i]] = [a[i], a[i + 1]]; set({ priorities: a }); }}>↓</button>
          </span>
        </div>
      ))}
    </div>
  ) },
  { title: "Your calendar", render: (p, set) => (<>
    <Field label="Team practice days"><Chips multi options={DAYS} value={p.practiceDays as (typeof DAYS)[number][]} onChange={(v) => set({ practiceDays: v as string[] })} /></Field>
    <Field label="Hitting lesson days"><Chips multi options={DAYS} value={p.lessonDays as (typeof DAYS)[number][]} onChange={(v) => set({ lessonDays: v as string[] })} /></Field>
    <Field label="Extra training days per week"><Segmented options={[3, 4, 5]} value={p.daysPerWeek} onChange={(v) => set({ daysPerWeek: v })} /></Field>
    <Field label="Minutes per session"><Segmented options={[45, 60, 75]} value={p.minutes} onChange={(v) => set({ minutes: v })} /></Field>
    <Field label="Showcases / big tournaments">
      {p.events.map((e, i) => (
        <div key={i} className="row" style={{ marginBottom: 6 }}>
          <span style={{ flex: 1 }}>{e.name} · {e.date}</span>
          <button type="button" className="link" onClick={() => set({ events: p.events.filter((_, j) => j !== i) })}>Remove</button>
        </div>
      ))}
      <EventAdder onAdd={(ev) => set({ events: [...p.events, ev] })} />
    </Field>
  </>) },
  { title: "Gear & access", render: (p, set) => (
    <Field label="Tap everything you can use">
      <Chips multi options={["Blast sensor", "Diamond Kinetics", "Pocket Radar", "Cage + machine", "Tee + net at home", "School gym", "Commercial gym", "Weighted bats (±20%)", "Med ball", "Plyo box", "Bands", "Sprint space"]}
        value={p.gear} onChange={(v) => set({ gear: v as string[] })} />
    </Field>
  ) },
  { title: "Lifting background", render: (p, set) => (<>
    <Field label="Experience"><Segmented options={["none", "team", "structured"] as const} value={p.liftingBackground} onChange={(v) => set({ liftingBackground: v })} labels={{ none: "None", team: "Team lifting", structured: "1+ yr program" }} /></Field>
    <Field label="Lifts you're comfortable with"><Chips multi options={["Squat", "Trap-bar deadlift", "RDL", "Bench", "Pull-ups", "Lunges", "Cleans"]} value={p.comfortableLifts} onChange={(v) => set({ comfortableLifts: v as string[] })} /></Field>
    <Field label="A coach or trainer supervises heavy lifts"><Segmented options={["no", "yes"]} value={p.supervised ? "yes" : "no"} onChange={(v) => set({ supervised: v === "yes" })} labels={{ no: "No", yes: "Yes" }} /></Field>
  </>) },
  { title: "Starting numbers", sub: "Skip anything you don't know — Test Day will measure it.", render: (p, set) => {
    const N = (k: keyof AthleteProfile["numbers"], label: string, unit: string, step = 0.5, decimals = 1) => (
      <Field label={label}><Stepper value={p.numbers[k] ?? null} onChange={(v) => set({ numbers: { ...p.numbers, [k]: v ?? undefined } })} step={step} decimals={decimals} unit={unit} max={200} /></Field>
    );
    return (<>
      {N("batSpeed", "Bat speed", "mph")}{N("teeEV", "Exit velo off tee", "mph")}{N("frontTossEV", "Exit velo, front toss", "mph")}
      {N("homeToFirst", "Home to first", "s", 0.01, 2)}
      <Field label="Home-to-first timed from"><Segmented options={["standing", "swing"]} value={p.homeToFirstMethod} onChange={(v) => set({ homeToFirstMethod: v as AthleteProfile["homeToFirstMethod"] })} labels={{ standing: "Standing start", swing: "From a swing" }} /></Field>
      {N("dash60", "60-yd dash", "s", 0.01, 2)}{N("broadJump", "Broad jump", "in", 1, 0)}{N("throwVelo", "Outfield throw velo", "mph")}
    </>);
  } },
  { title: "Your hitting coach", sub: "Your coach owns your swing. The app reinforces it — never changes it.", render: (p, set) => (<>
    <Field label="What you're working on"><Chips multi options={["Load", "Separation", "Bat path", "Lower half", "Timing", "Approach", "Slapping"]} value={p.hittingFocus} onChange={(v) => set({ hittingFocus: v as string[] })} /></Field>
    <Field label="Cues your coach uses (optional)"><textarea rows={3} value={p.hittingCues} onChange={(e) => set({ hittingCues: e.target.value })} placeholder="e.g. 'stay connected', 'knob to the ball'" /></Field>
  </>) },
  { title: "Body check", render: (p, set) => (<>
    <Field label="Past injuries (tap areas)"><Chips multi options={REGIONS} value={p.pastInjuries} onChange={(v) => set({ pastInjuries: v as Region[] })} /></Field>
    <Field label="Anything hurting right now (not just sore)?"><Segmented options={["no", "yes"]} value={p.painNow ? "yes" : "no"} onChange={(v) => set({ painNow: v === "yes" })} labels={{ no: "No", yes: "Yes" }} /></Field>
    {p.painNow && <p className="warn small">Tell your dad, and use the pain question in tomorrow&apos;s check-in so your plan works around it.</p>}
  </>) },
  { title: "Your coach", render: (p, set) => (<>
    <Field label="Tone"><Segmented options={["direct", "hype"] as const} value={p.tone} onChange={(v) => set({ tone: v })} labels={{ direct: "Direct", hype: "Hype" }} /></Field>
    <Field label="Reminders"><Segmented options={["off", "important", "daily"] as const} value={p.proactive} onChange={(v) => set({ proactive: v })} labels={{ off: "Off", important: "Important only", daily: "Daily" }} /></Field>
    <Field label="Anything else? (optional)"><textarea rows={3} value={p.notes} onChange={(e) => set({ notes: e.target.value })} /></Field>
  </>) },
];

function EventAdder({ onAdd }: { onAdd: (e: { name: string; date: string }) => void }) {
  const [name, setName] = useState("");
  const [date, setDate] = useState("");
  return (
    <div className="row" style={{ gap: 6 }}>
      <input placeholder="Event" value={name} onChange={(e) => setName(e.target.value)} style={{ flex: 2 }} />
      <input type="date" value={date} onChange={(e) => setDate(e.target.value)} style={{ flex: 1.4 }} />
      <button type="button" disabled={!name || !date} onClick={() => { onAdd({ name, date }); setName(""); setDate(""); }}>Add</button>
    </div>
  );
}

export default function Setup({ role, initial }: { role: "parent" | "athlete"; initial: Profile | null }) {
  const athlete = role === "athlete";
  const [p, setP] = useState<Profile>(initial ?? (athlete ? ATHLETE_DEFAULT : ADULT_DEFAULT));
  const [i, setI] = useState(0);
  const [busy, setBusy] = useState("");
  const [err, setErr] = useState("");
  const steps = (athlete ? athleteSteps : adultSteps) as Step<Profile>[];
  const step = steps[i];
  const set = (patch: Partial<Profile>) => setP((x) => ({ ...x, ...patch }) as Profile);
  const last = i === steps.length - 1;
  const today = localDate();
  const nextMonday = (() => { const d = new Date(); d.setDate(d.getDate() + ((8 - d.getDay()) % 7 || 7)); return localDate(d); })();
  const [startChoice, setStartChoice] = useState<"today" | "monday" | "pick">("today");
  const [pickDate, setPickDate] = useState(nextMonday);
  const startDate = startChoice === "today" ? today : startChoice === "monday" ? nextMonday : pickDate;

  async function finish() {
    setErr("");
    try {
      setBusy("Saving…");
      await api("/api/profile", { body: { profile: p } });
      setBusy("Your coach is building your program — about a minute…");
      await api("/api/program", { body: { date: today, startDate } });
      window.location.href = "/today";
    } catch (e) {
      setErr((e as Error).message);
      setBusy("");
    }
  }

  return (
    <main>
      {initial && <BackButton fallback="/me" label="Cancel" />}
      <div className="row between small muted"><span>Setup</span><span>{i + 1} of {steps.length}</span></div>
      <div className="wizard-progress"><div style={{ width: `${((i + 1) / steps.length) * 100}%` }} /></div>
      <h1>{step.title}</h1>
      {step.sub && <p className="muted" style={{ marginTop: -6, marginBottom: 18 }}>{step.sub}</p>}
      {step.render(p, set)}
      {last && (
        <Field label="When do you want to start?" hint="Week 1 begins on this day. You can change it later on the Workout tab.">
          <Segmented options={["today", "monday", "pick"] as const} value={startChoice} onChange={setStartChoice}
            labels={{ today: "Today", monday: "Next Monday", pick: "Pick a date" }} />
          {startChoice === "pick" && <input type="date" value={pickDate} min={today} onChange={(e) => setPickDate(e.target.value)} style={{ marginTop: 10, maxWidth: 200 }} />}
          <p className="small muted" style={{ marginTop: 6 }}>Starts {new Date(`${startDate}T12:00:00`).toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })}</p>
        </Field>
      )}
      {err && <p className="error">{err}</p>}
      {busy && <p className="muted"><span className="spinner" />{busy}</p>}
      <div className="wizard-nav">
        {i > 0 && <button type="button" onClick={() => setI(i - 1)} disabled={!!busy}>Back</button>}
        <button type="button" className="primary" disabled={!!busy} onClick={() => (last ? finish() : (setI(i + 1), window.scrollTo(0, 0)))}>
          {last ? "Build my program" : "Next"}
        </button>
      </div>
    </main>
  );
}
