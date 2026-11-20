"use client";
import { useMemo, useState } from "react";
import { EXERCISES, type Exercise } from "@/lib/exercises";

const FILTERS = ["All", "lower", "upper", "core", "hitting", "speed", "throwing", "plyo", "cardio", "mobility"] as const;

export default function ExercisePicker({ onPick, onClose, title = "Add exercise" }: { onPick: (e: Exercise) => void; onClose: () => void; title?: string }) {
  const [q, setQ] = useState("");
  const [f, setF] = useState<(typeof FILTERS)[number]>("All");
  const list = useMemo(() => {
    const t = q.trim().toLowerCase();
    return EXERCISES.filter((e) => (f === "All" || e.tags.includes(f)) && (!t || `${e.name} ${e.muscles.join(" ")} ${e.equipment.join(" ")}`.toLowerCase().includes(t)));
  }, [q, f]);
  return (
    <div className="sheet-backdrop" onClick={onClose}>
      <div className="sheet" onClick={(e) => e.stopPropagation()} role="dialog" aria-label={title}>
        <div className="row between"><h2 style={{ margin: 0 }}>{title}</h2><button className="link" onClick={onClose}>Cancel</button></div>
        <input autoFocus placeholder="Search exercises" value={q} onChange={(e) => setQ(e.target.value)} style={{ margin: "10px 0" }} />
        <div className="chips scroll-x">
          {FILTERS.map((x) => <button key={x} className={`chip ${f === x ? "on" : ""}`} onClick={() => setF(x)}>{x === "All" ? "All" : x[0].toUpperCase() + x.slice(1)}</button>)}
        </div>
        <ul className="picker-list">
          {list.map((e) => (
            <li key={e.id}><button onClick={() => onPick(e)}>
              <b>{e.name}</b><span className="small muted">{e.muscles.join(", ")} · {e.equipment.join(", ")}</span>
            </button></li>
          ))}
          {!list.length && <li className="muted small" style={{ padding: 12 }}>No matches.</li>}
        </ul>
      </div>
    </div>
  );
}
