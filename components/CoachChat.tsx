"use client";
import { useEffect, useRef, useState } from "react";
import { api, localDate } from "@/lib/client";
import type { ChatLine } from "@/lib/chat";
import { IconCheck } from "./icons";

const SUGGEST = {
  parent: ["How am I doing this week?", "Make Thursday Zone 2 cardio", "I'm sore — adjust today", "What should I eat tonight?", "Log a 30 g protein shake"],
  athlete: ["What should I focus on today?", "My arm feels off", "Swap today's lift — no gym access", "How do I raise my bat speed?"],
};

export default function CoachChat({ role }: { role: "parent" | "athlete" }) {
  const [lines, setLines] = useState<ChatLine[] | null>(null);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const end = useRef<HTMLDivElement>(null);

  useEffect(() => { api<{ display: ChatLine[] }>("/api/chat").then((r) => setLines(r.display), (e) => setErr(e.message)); }, []);
  useEffect(() => { end.current?.scrollIntoView({ behavior: "smooth" }); }, [lines, busy]);

  async function send(msg: string) {
    const t = msg.trim();
    if (!t || busy) return;
    setErr(""); setBusy(true); setText("");
    setLines((l) => [...(l ?? []), { role: "me", text: t, at: new Date().toISOString() }]);
    try { setLines((await api<{ display: ChatLine[] }>("/api/chat", { body: { text: t, date: localDate() } })).display); }
    catch (e) { setErr((e as Error).message); setText(t); setLines((l) => (l ?? []).slice(0, -1)); }
    setBusy(false);
  }

  return (
    <main className="chat-page">
      <h1 style={{ marginBottom: 4 }}>Coach</h1>
      <p className="small muted" style={{ marginTop: 0 }}>Ask anything, or tell it what to change. {role === "athlete" ? "Your chats are private." : "Private to you."}</p>
      {!lines && !err && <p className="muted"><span className="spinner" />Loading…</p>}
      <div className="chat">
        {lines?.length === 0 && <div className="bubble coach">Hey — I know your plan, check-ins and progress. What do you need?</div>}
        {lines?.map((l, i) => (
          <div key={i} className={`bubble ${l.role}`}>
            {l.text}
            {l.actions && <div className="chat-actions">{l.actions.map((a) => <span key={a} className="chat-action"><IconCheck size={14} />{a}</span>)}</div>}
          </div>
        ))}
        {busy && <div className="bubble coach muted"><span className="spinner" />Thinking…</div>}
        <div ref={end} />
      </div>
      {err && <p className="error">{err}</p>}
      {!busy && (lines?.length ?? 0) < 4 && (
        <div className="chips scroll-x" style={{ marginTop: 12 }}>
          {SUGGEST[role].map((s) => <button key={s} className="chip" onClick={() => send(s)}>{s}</button>)}
        </div>
      )}
      <form className="chat-composer" onSubmit={(e) => { e.preventDefault(); send(text); }}>
        <textarea rows={1} value={text} placeholder="Message your coach" aria-label="Message your coach" onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(text); } }} />
        <button className="primary" disabled={busy || !text.trim()}>Send</button>
      </form>
    </main>
  );
}
