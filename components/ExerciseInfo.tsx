"use client";
import { useEffect, useState } from "react";
import { api } from "@/lib/client";
import { EXERCISE_VIDEOS } from "@/lib/exercise-videos";
import { getExercise } from "@/lib/exercises";
import type { ExerciseGuide } from "@/lib/schemas";
import { IconClose, IconPlay } from "./icons";

/** Demo video that plays inline in the app (privacy-enhanced YouTube player, loaded only when tapped). */
export function DemoVideo({ id }: { id: string }) {
  const v = EXERCISE_VIDEOS[id];
  const [play, setPlay] = useState(false);
  if (!v) return null;
  return (
    <figure className="demo">
      <div className="demo-frame">
        {play ? (
          <iframe src={`https://www.youtube-nocookie.com/embed/${v.youtubeId}?autoplay=1&playsinline=1&rel=0&modestbranding=1`}
            title={v.title} allow="autoplay; encrypted-media; picture-in-picture" allowFullScreen />
        ) : (
          <button className="demo-poster" onClick={() => setPlay(true)} aria-label={`Play demo: ${v.title}`}
            style={{ backgroundImage: `url(https://i.ytimg.com/vi/${v.youtubeId}/hqdefault.jpg)` }}>
            <span className="demo-play"><IconPlay size={26} /></span>
            <span className="demo-len">{Math.floor(v.seconds / 60)}:{String(v.seconds % 60).padStart(2, "0")}</span>
          </button>
        )}
      </div>
      <figcaption className="small muted">Demo: {v.title} · {v.channel}</figcaption>
    </figure>
  );
}

export function ExerciseGuideView({ id }: { id: string }) {
  const [g, setG] = useState<ExerciseGuide | null>(null);
  const [err, setErr] = useState("");
  useEffect(() => { setG(null); api<{ guide: ExerciseGuide }>(`/api/exercises/guide?id=${id}`).then((r) => setG(r.guide), (e) => setErr(e.message)); }, [id]);
  if (err) return <p className="small error">{err}</p>;
  if (!g) return <p className="small muted"><span className="spinner" />Loading the how-to guide…</p>;
  return (
    <div className="guide">
      <p style={{ marginTop: 0 }}>{g.summary}</p>
      <h3>Setup</h3><ul>{g.setup.map((x) => <li key={x}>{x}</li>)}</ul>
      <h3>How to do it</h3><ol>{g.steps.map((x) => <li key={x}>{x}</li>)}</ol>
      <h3>Cues</h3><div className="chips">{g.cues.map((x) => <span key={x} className="chip static">{x}</span>)}</div>
      <h3>Common mistakes</h3><ul>{g.mistakes.map((x) => <li key={x}>{x}</li>)}</ul>
      <div className="grid2 guide-var">
        <div><b className="small">Easier</b><p className="small muted">{g.easier}</p></div>
        <div><b className="small">Harder</b><p className="small muted">{g.harder}</p></div>
      </div>
      <p className="small"><b>Breathing:</b> <span className="muted">{g.breathing}</span></p>
      {g.safety && <p className="small why"><b>Safety:</b> {g.safety}</p>}
    </div>
  );
}

/** Bottom sheet with the demo and guide — used mid-workout and from routines without leaving the screen. */
export function ExerciseSheet({ id, onClose, extra }: { id: string; onClose: () => void; extra?: React.ReactNode }) {
  const e = getExercise(id);
  if (!e) return null;
  return (
    <div className="sheet-backdrop" onClick={onClose}>
      <div className="sheet" onClick={(ev) => ev.stopPropagation()} role="dialog" aria-label={e.name}>
        <div className="row between" style={{ flexWrap: "nowrap", alignItems: "flex-start" }}>
          <div><h2 style={{ margin: 0 }}>{e.name}</h2><span className="small muted">{e.muscles.join(", ")} · {e.equipment.join(", ")}</span></div>
          <button className="link" aria-label="Close" onClick={onClose}><IconClose /></button>
        </div>
        {extra}
        <DemoVideo id={id} />
        <ExerciseGuideView id={id} />
      </div>
    </div>
  );
}
