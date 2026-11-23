"use client";
import { useEffect, useState } from "react";
import { api, localDate } from "@/lib/client";
import type { ScreenshotWorkout } from "@/lib/schemas";

/** Shrink a photo to a JPEG data URL (max 1600px) so it uploads fast. */
export async function toDataUrl(file: File): Promise<string> {
  const img = await createImageBitmap(file);
  const scale = Math.min(1, 1600 / Math.max(img.width, img.height));
  const c = document.createElement("canvas");
  c.width = Math.round(img.width * scale); c.height = Math.round(img.height * scale);
  c.getContext("2d")!.drawImage(img, 0, 0, c.width, c.height);
  return c.toDataURL("image/jpeg", 0.85);
}

type Read = { workout: ScreenshotWorkout; candidates: { id: string; name: string }[] };

export default function ScreenshotImport({ image, onDone, onCancel }: { image: string; onDone: (summary: string) => void; onCancel: () => void }) {
  const [r, setR] = useState<Read | null>(null);
  const [w, setW] = useState<ScreenshotWorkout | null>(null);
  const [attach, setAttach] = useState<string>("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    api<Read>("/api/import", { body: { action: "read", image, today: localDate() } })
      .then((x) => { setR(x); setW(x.workout); if (x.candidates.length && /strength|training/i.test(x.workout.activity)) setAttach(x.candidates[0].id); }, (e) => setErr(e.message));
  }, [image]);
  const num = (k: keyof ScreenshotWorkout, label: string, unit: string) => (
    <label>{label}<span className="row" style={{ flexWrap: "nowrap", gap: 6 }}>
      <input inputMode="decimal" value={(w?.[k] as number) || ""} onChange={(e) => setW(w && { ...w, [k]: Number(e.target.value) || 0 })} />
      <span className="small muted">{unit}</span></span></label>
  );

  async function save() {
    if (!w) return;
    setBusy(true); setErr("");
    try {
      const x = await api<{ summary: string }>("/api/import", { body: { action: "save", workout: w, attachTo: attach || null, today: localDate() } });
      onDone(x.summary);
    } catch (e) { setErr((e as Error).message); setBusy(false); }
  }

  return (
    <div className="card import-card">
      <div className="row" style={{ gap: 12, flexWrap: "nowrap", alignItems: "flex-start" }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={image} alt="Your screenshot" className="import-thumb" />
        <div style={{ flex: 1, minWidth: 0 }}>
          <span className="eyebrow">Import workout</span>
          {!r && !err && <p className="small muted"><span className="spinner" />Reading your screenshot…</p>}
          {w && !w.found && <p className="small">That doesn&apos;t look like a workout summary. Try a screenshot of the finished-workout screen.</p>}
          {w?.found && <p className="small" style={{ margin: "4px 0 0" }}><b>{w.activity}</b> · {w.source}</p>}
        </div>
      </div>
      {w?.found && (<>
        <div className="grid2" style={{ marginTop: 12 }}>
          <label>Activity<input value={w.activity} onChange={(e) => setW({ ...w, activity: e.target.value })} /></label>
          <label>Date<input type="date" value={w.date} onChange={(e) => setW({ ...w, date: e.target.value })} /></label>
          {num("durationMin", "Duration", "min")}
          {num("distanceMi", "Distance", "mi")}
          {num("avgHR", "Avg HR", "bpm")}
          {num("maxHR", "Max HR", "bpm")}
          {num("activeCalories", "Active cal", "kcal")}
          {num("elevationFt", "Climb", "ft")}
        </div>
        {r && r.candidates.length > 0 && (
          <div style={{ marginTop: 12 }}>
            <span className="small muted">Save as</span>
            <div className="chips" style={{ marginTop: 6 }}>
              <button className={`chip ${!attach ? "on" : ""}`} onClick={() => setAttach("")}>New workout</button>
              {r.candidates.map((c) => <button key={c.id} className={`chip ${attach === c.id ? "on" : ""}`} onClick={() => setAttach(c.id)}>Add to {c.name}</button>)}
            </div>
          </div>
        )}
      </>)}
      {err && <p className="error">{err}</p>}
      <div className="row" style={{ flexWrap: "nowrap", marginTop: 12 }}>
        {w?.found && <button className="primary" style={{ flexGrow: 1 }} onClick={save} disabled={busy}>{busy ? "Saving…" : attach ? "Add to workout" : "Log workout"}</button>}
        <button onClick={onCancel} style={{ flexGrow: w?.found ? 0 : 1 }}>Cancel</button>
      </div>
    </div>
  );
}
