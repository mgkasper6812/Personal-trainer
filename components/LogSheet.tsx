"use client";
import { useEffect, useState } from "react";
import { api, localDate } from "@/lib/client";
import type { Meal } from "@/lib/data";
import { loadActive, startToday } from "@/lib/workout-client";
import FoodLogger from "./FoodLogger";
import { IconCamera, IconChat, IconCheck, IconClose, IconImage, IconPlay, IconScale, IconTrain } from "./icons";
import ScreenshotImport, { toDataUrl } from "./ScreenshotImport";
import { NumberInput } from "./ui";

type View = "menu" | "food" | "weight" | "import";
export const openLog = (view: View = "menu", meal?: Meal) => window.dispatchEvent(new CustomEvent("open-log", { detail: { view, meal } }));

/** The one place to log anything: food, weight, check-in, workouts, screenshots, habits. Opened by the center + button. */
export default function LogSheet({ role }: { role: "parent" | "athlete" }) {
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<View>("menu");
  const [meal, setMeal] = useState<Meal | undefined>();
  const [done, setDone] = useState("");
  const [lb, setLb] = useState<number | null>(null);
  const [shot, setShot] = useState<string | null>(null);
  const [err, setErr] = useState("");
  const [active, setActive] = useState<string | null>(null);
  const adult = role === "parent";

  useEffect(() => {
    const h = (e: Event) => {
      const d = (e as CustomEvent<{ view: View; meal?: Meal }>).detail ?? { view: "menu" };
      setView(d.view); setMeal(d.meal); setDone(""); setErr(""); setShot(null); setActive(loadActive()?.name ?? null); setOpen(true);
    };
    window.addEventListener("open-log", h);
    return () => window.removeEventListener("open-log", h);
  }, []);
  if (!open) return null;
  const close = () => setOpen(false);
  const finish = (msg: string) => { setDone(msg); setView("menu"); setTimeout(close, 1200); };
  const go = (href: string) => { close(); window.location.href = href; };

  async function saveWeight() {
    if (!lb) return;
    setErr("");
    try { await api("/api/weight", { body: { date: localDate(), lb } }); window.dispatchEvent(new Event("food-logged")); finish(`Weight ${lb} lb logged`); }
    catch (e) { setErr((e as Error).message); }
  }

  return (
    <div className="sheet-backdrop" onClick={close}>
      <div className="sheet log-sheet" onClick={(e) => e.stopPropagation()} role="dialog" aria-label="Log">
        <div className="row between" style={{ flexWrap: "nowrap" }}>
          {view === "menu" ? <h2 style={{ margin: 0 }}>Log</h2> : <button className="back-btn" onClick={() => setView("menu")}>‹ Log</button>}
          <button className="link" aria-label="Close" onClick={close}><IconClose /></button>
        </div>
        {done && <p className="done-note"><IconCheck size={16} /> {done}</p>}

        {view === "menu" && (
          <div className="log-grid">
            {adult && <button className="log-tile big" onClick={() => setView("food")}><IconCamera size={26} /><b>Food</b><span>Photo, label or type it</span></button>}
            <button className="log-tile" onClick={() => { close(); startToday(); }}>{active ? <IconPlay size={24} /> : <IconTrain size={24} />}<b>{active ? "Resume workout" : "Workout"}</b><span>{active ?? "Start today's"}</span></button>
            {adult && <button className="log-tile" onClick={() => setView("weight")}><IconScale size={24} /><b>Weight</b><span>Morning weigh-in</span></button>}
            <button className="log-tile" onClick={() => go("/today?checkin=1")}><IconCheck size={24} /><b>Check in</b><span>30 seconds</span></button>
            <button className="log-tile" onClick={() => setView("import")}><IconImage size={24} /><b>Workout screenshot</b><span>Apple Fitness, Strava</span></button>
            <button className="log-tile" onClick={() => go("/today#habits")}><IconCheck size={24} /><b>Habits</b><span>Tick off today</span></button>
            <button className="log-tile" onClick={() => go(`/coach?draft=${encodeURIComponent("Log my workout: ")}`)}><IconChat size={24} /><b>Tell the coach</b><span>&ldquo;Walked 30 min&rdquo; or squats 3×8 @ 185</span></button>
          </div>
        )}

        {view === "food" && <FoodLogger initialMeal={meal} onLogged={finish} />}

        {view === "weight" && (
          <div style={{ marginTop: 12 }}>
            <label>Weight (lb)<NumberInput value={lb} onChange={setLb} decimals={1} placeholder="e.g. 248.2" /></label>
            {err && <p className="error">{err}</p>}
            <button className="primary wide" style={{ marginTop: 12 }} onClick={saveWeight} disabled={!lb}>Save weight</button>
          </div>
        )}

        {view === "import" && (shot
          ? <ScreenshotImport image={shot} onCancel={() => setShot(null)} onDone={(s) => finish(s.split(":")[0] + " — logged")} />
          : (
            <label className="log-tile big" style={{ marginTop: 12, cursor: "pointer" }}>
              <IconImage size={26} /><b>Choose a screenshot</b><span>The finished-workout summary from Apple Fitness, Health, Strava or Garmin</span>
              <input type="file" accept="image/*" hidden onChange={async (e) => { const f = e.target.files?.[0]; if (f) setShot(await toDataUrl(f)); }} />
            </label>
          ))}
      </div>
    </div>
  );
}
