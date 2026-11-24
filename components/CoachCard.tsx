"use client";
import { useEffect, useState } from "react";
import { api } from "@/lib/client";
import type { ChatLine } from "@/lib/chat";
import { IconChat } from "./icons";

/** The coach's latest message today (check-in or workout feedback), with quick replies. */
export default function CoachCard({ date }: { date: string }) {
  const [l, setL] = useState<ChatLine | null>(null);
  useEffect(() => { api<{ latest: ChatLine | null }>("/api/chat?latest=1").then((x) => setL(x.latest), () => {}); }, [date]);
  if (!l || l.kind === "review") return null;
  const local = new Date(l.at); const today = new Date(`${date}T12:00:00`);
  if (local.toDateString() !== today.toDateString()) return null;
  return (
    <section className="card coach-card">
      <div className="row" style={{ gap: 8 }}><IconChat size={18} /><span className="eyebrow">Coach · {local.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })}</span></div>
      <p style={{ margin: "8px 0 10px" }}>{l.text}</p>
      <div className="reply-chips">
        {(l.replies ?? []).map((x) => <a key={x} className="chip" href={`/coach?say=${encodeURIComponent(x)}`}>{x}</a>)}
        <a className="chip" href="/coach">Reply</a>
      </div>
    </section>
  );
}
