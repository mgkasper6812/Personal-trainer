"use client";
import { useEffect, useState } from "react";
import { api } from "@/lib/client";
import type { StoredReview } from "@/lib/review";

const GRADE_TONE: Record<string, string> = { A: "green", B: "green", C: "yellow", D: "red", F: "red" };

/** "Yesterday's report" — the coach's graded review of the previous day, shown each morning. */
export default function ReviewCard({ date }: { date: string }) {
  const [r, setR] = useState<StoredReview | null | undefined>(undefined);
  const [open, setOpen] = useState(true);
  const [err, setErr] = useState("");
  useEffect(() => {
    try { setOpen(localStorage.getItem(`ft-review-closed-${date}`) !== "1"); } catch {}
    api<{ review: StoredReview | null }>(`/api/review?date=${date}`).then((x) => setR(x.review), (e) => { setErr(e.message); setR(null); });
  }, [date]);
  const toggle = () => { const n = !open; setOpen(n); try { localStorage.setItem(`ft-review-closed-${date}`, n ? "0" : "1"); } catch {} };

  if (r === undefined) return <section className="card review"><span className="eyebrow">Yesterday&apos;s report</span><p className="small muted"><span className="spinner" />Your coach is reviewing yesterday…</p></section>;
  if (!r) return err ? <p className="small error">Couldn&apos;t load yesterday&apos;s report: {err}</p> : null;
  const day = new Date(`${r.forDate}T12:00:00`).toLocaleDateString(undefined, { weekday: "long" });
  return (
    <section className={`card review tone-${GRADE_TONE[r.grade]}`}>
      <button className="review-head" onClick={toggle} aria-expanded={open}>
        <span className={`grade ${GRADE_TONE[r.grade]}`} aria-label={`Grade ${r.grade}`}>{r.grade}</span>
        <span style={{ flex: 1, minWidth: 0 }}>
          <span className="eyebrow">{day}&apos;s report</span>
          <b className="review-headline">{r.headline}</b>
        </span>
        <span className="small muted">{open ? "Hide" : "Read"}</span>
      </button>
      {open && (<>
        {r.wins.length > 0 && <div className="review-list wins"><span className="eyebrow">What went well</span><ul>{r.wins.map((x) => <li key={x}>{x}</li>)}</ul></div>}
        {r.misses.length > 0 && <div className="review-list misses"><span className="eyebrow">What didn&apos;t</span><ul>{r.misses.map((x) => <li key={x}>{x}</li>)}</ul></div>}
        <div className="review-list focus"><span className="eyebrow">Today&apos;s focus</span><ol>{r.todayFocus.map((x) => <li key={x}>{x}</li>)}</ol></div>
        {r.advice?.length > 0 && <div className="review-list advice"><span className="eyebrow">Coach&apos;s advice</span><ul>{r.advice.map((x) => <li key={x}>{x}</li>)}</ul></div>}
        <p className="review-closer">{r.closer}</p>
        <div className="reply-chips">
          {(r.replies ?? []).map((x) => <a key={x} className="chip" href={`/coach?say=${encodeURIComponent(x)}`}>{x}</a>)}
          <a className="chip" href="/coach">Talk to coach</a>
        </div>
      </>)}
    </section>
  );
}
