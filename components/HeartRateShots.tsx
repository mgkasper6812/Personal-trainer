"use client";
import { useRef, useState } from "react";
import { api, localDate } from "@/lib/client";
import type { ScreenshotWorkout } from "@/lib/schemas";
import { toDataUrl } from "./ScreenshotImport";
import { IconImage } from "./icons";

export type { Watch } from "@/lib/cardio";
import type { Watch } from "@/lib/cardio";

/** Turn one screenshot's numbers into heart-rate data, keeping anything an earlier screenshot already filled in. */
export function mergeShot(prev: Watch | undefined, w: ScreenshotWorkout): Watch {
  const pos = (x: number) => (x > 0 ? Math.round(x * 10) / 10 : undefined);
  const next: Partial<Watch> = {
    avgHR: pos(w.avgHR), maxHR: pos(w.maxHR), calories: pos(w.activeCalories) ?? pos(w.totalCalories), durationMin: pos(w.durationMin),
    distanceMi: pos(w.distanceMi), elevationFt: pos(w.elevationFt), pace: w.avgPace || undefined, activity: w.activity || undefined, zones: w.zoneMinutes?.length ? w.zoneMinutes.map((z) => `Z${z.zone} ${z.minutes}m`).join(", ") : undefined, source: w.source,
  };
  const clean = Object.fromEntries(Object.entries(next).filter(([, v]) => v !== undefined));
  return { ...(prev ?? {}), ...clean, syncedAt: new Date().toISOString() } as Watch;
}

export function WatchStats({ w }: { w: Watch }) {
  return (
    <div className="stats">
      {w.avgHR ? <div className="stat"><b>{w.avgHR}</b>avg bpm</div> : null}
      {w.maxHR ? <div className="stat"><b>{w.maxHR}</b>max bpm</div> : null}
      {w.calories ? <div className="stat"><b>{Math.round(w.calories)}</b>active kcal</div> : null}
      {w.durationMin ? <div className="stat"><b>{Math.round(w.durationMin)}</b>min</div> : null}
      {w.distanceMi ? <div className="stat"><b>{w.distanceMi}</b>mi</div> : null}
    </div>
  );
}

/** Pick 1–3 screenshots (Apple Fitness summary, heart-rate zones, Strava) and read the numbers off them. */
export default function HeartRateShots({ value, onChange, label = "Add heart-rate screenshot" }: { value?: Watch; onChange: (w: Watch | undefined) => void; label?: string }) {
  const ref = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(""); const [err, setErr] = useState("");
  async function pick(files: FileList | null) {
    const list = [...(files ?? [])].slice(0, 3);
    if (!list.length) return;
    setErr(""); let cur = value; let read = 0;
    for (let i = 0; i < list.length; i++) {
      setBusy(`Reading screenshot ${i + 1} of ${list.length}…`);
      try {
        const image = await toDataUrl(list[i]);
        const r = await api<{ workout: ScreenshotWorkout }>("/api/import", { body: { action: "read", image, today: localDate() } });
        if (r.workout.found) { cur = mergeShot(cur, r.workout); read++; }
      } catch (e) { setErr((e as Error).message); }
    }
    setBusy("");
    if (read) onChange(cur); else if (!err) setErr("Couldn't find workout numbers in that image. Try the summary screen from Apple Fitness or Strava.");
  }
  return (
    <div className="hr-shots">
      <input ref={ref} type="file" accept="image/*" multiple hidden onChange={(e) => { pick(e.target.files); e.target.value = ""; }} />
      {value && <>
        <WatchStats w={value} />
        {value.zones && <p className="small muted" style={{ margin: "4px 0 0" }}>Zones: {value.zones}</p>}
        {value.source && <p className="small muted" style={{ margin: "2px 0 0" }}>From {value.source}</p>}
      </>}
      {busy ? <p className="small muted"><span className="spinner" />{busy}</p> : (
        <div className="row" style={{ gap: 8, marginTop: value ? 10 : 0 }}>
          <button type="button" className="row" style={{ gap: 8 }} onClick={() => ref.current?.click()}><IconImage size={18} />{value ? "Add another screenshot" : label}</button>
          {value && <button type="button" className="link small" onClick={() => onChange(undefined)}>Remove</button>}
        </div>
      )}
      {!value && !busy && <p className="small muted" style={{ margin: "6px 0 0" }}>Apple Fitness, Watch or Strava summary — add the heart-rate zones screen too if you like (up to 3).</p>}
      {err && <p className="error small">{err}</p>}
    </div>
  );
}
