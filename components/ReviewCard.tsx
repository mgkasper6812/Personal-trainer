"use client";
import { useEffect, useState } from "react";
import { api } from "@/lib/client";
import type { StoredReview } from "@/lib/review";
import { IconChevron, IconClose } from "./icons";

const GRADE_TONE: Record<string, string> = { A: "green", B: "green", C: "yellow", D: "red", F: "red" };

/** Yesterday's graded report. undefined = still loading, null = none. */
export function useReview(date: string, enabled: boolean) {
  const [r, setR] = useState<StoredReview | null | undefined>(enabled ? undefined : null);
  useEffect(() => {
    if (!enabled) { setR(null); return; }
    setR(undefined);
    api<{ review: StoredReview | null }>(`/api/review?date=${date}`).then((x) => setR(x.review), () => setR(null));
  }, [date, enabled]);
  return r;
}

/** The small "C · Yesterday" chip on Home's status strip; tapping opens the full report. */
export function ReviewChip({ r, onOpen }: { r: StoredReview | null | undefined; onOpen: () => void }) {
  if (r === null) return null;
  if (r === undefined) return <span className="status-chip"><span className="spinner" style={{ margin: 0 }} />Report</span>;
  return (
    <button className="status-chip" onClick={onOpen} aria-label={`Yesterday's report: grade ${r.grade}. ${r.headline}`}>
      <span className={`grade-mini ${GRADE_TONE[r.grade]}`}>{r.grade}</span>Yesterday<IconChevron size={14} />
    </button>
  );
}

/** The full report in a bottom sheet. */
export function ReviewSheet({ r, onClose }: { r: StoredReview; onClose: () => void }) {
  const day = new Date(`${r.forDate}T12:00:00`).toLocaleDateString(undefined, { weekday: "long" });
  return (
    <div className="sheet-backdrop" onClick={onClose}>
      <div className={`sheet review tone-${GRADE_TONE[r.grade]}`} onClick={(e) => e.stopPropagation()} role="dialog" aria-label={`${day}'s report`}>
        <div className="review-head" style={{ cursor: "default" }}>
          <span className={`grade ${GRADE_TONE[r.grade]}`} aria-label={`Grade ${r.grade}`}>{r.grade}</span>
          <span style={{ flex: 1, minWidth: 0 }}>
            <span className="eyebrow">{day}&apos;s report</span>
            <b className="review-headline">{r.headline}</b>
          </span>
          <button className="link" aria-label="Close" onClick={onClose}><IconClose /></button>
        </div>
        {r.wins.length > 0 && <div className="review-list wins"><span className="eyebrow">What went well</span><ul>{r.wins.map((x) => <li key={x}>{x}</li>)}</ul></div>}
        {r.misses.length > 0 && <div className="review-list misses"><span className="eyebrow">What didn&apos;t</span><ul>{r.misses.map((x) => <li key={x}>{x}</li>)}</ul></div>}
        <div className="review-list focus"><span className="eyebrow">Today&apos;s focus</span><ol>{r.todayFocus.map((x) => <li key={x}>{x}</li>)}</ol></div>
        {r.advice?.length > 0 && <div className="review-list advice"><span className="eyebrow">Coach&apos;s advice</span><ul>{r.advice.map((x) => <li key={x}>{x}</li>)}</ul></div>}
        <p className="review-closer">{r.closer}</p>
        <div className="reply-chips">
          {(r.replies ?? []).map((x) => <a key={x} className="chip" href={`/coach?say=${encodeURIComponent(x)}`}>{x}</a>)}
          <a className="chip" href="/coach">Talk to coach</a>
        </div>
      </div>
    </div>
  );
}
