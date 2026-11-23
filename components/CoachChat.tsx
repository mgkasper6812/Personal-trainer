"use client";
import { useEffect, useRef, useState } from "react";
import { api, localDate } from "@/lib/client";
import type { ChatLine } from "@/lib/chat";
import { IconCheck, IconImage } from "./icons";
import ScreenshotImport, { toDataUrl } from "./ScreenshotImport";

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
  const fileRef = useRef<HTMLInputElement>(null);
  const [image, setImage] = useState<string | null>(null);

  async function pick(file: File | null | undefined) {
    if (!file || !file.type.startsWith("image/")) return;
    try { setImage(await toDataUrl(file)); } catch { setErr("Couldn't open that image."); }
  }
  useEffect(() => {
    const onPaste = (e: ClipboardEvent) => {
      const f = [...(e.clipboardData?.files ?? [])].find((x) => x.type.startsWith("image/"));
      if (f) { e.preventDefault(); pick(f); }
    };
    window.addEventListener("paste", onPaste);
    return () => window.removeEventListener("paste", onPaste);
  }, []);

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
      <p className="small muted" style={{ marginTop: 0 }}>Ask anything, tell it what to change, or tap the image button to import an Apple Fitness or Strava screenshot. {role === "athlete" ? "Your chats are private." : "Private to you."}</p>
      {!lines && !err && <p className="muted"><span className="spinner" />Loading…</p>}
      <div className="chat">
        {lines?.length === 0 && <div className="bubble coach">Hey — I know your plan, check-ins and progress. What do you need?</div>}
        {lines?.map((l, i) => (
          <div key={i} className={`bubble ${l.role}`}>
            {l.text}
            {l.actions && <div className="chat-actions">{l.actions.map((a) => <span key={a} className="chat-action"><IconCheck size={14} />{a}</span>)}</div>}
          </div>
        ))}
        {image && <ScreenshotImport image={image} onCancel={() => setImage(null)} onDone={(summary) => { setImage(null); send(`I logged a workout from a screenshot — ${summary}`); }} />}
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
        <input ref={fileRef} type="file" accept="image/*" hidden onChange={(e) => { pick(e.target.files?.[0]); e.target.value = ""; }} />
        <button type="button" className="attach-btn" aria-label="Import a workout screenshot (Apple Fitness, Strava)" onClick={() => fileRef.current?.click()}><IconImage size={22} /></button>
        <textarea rows={1} value={text} placeholder="Message your coach" aria-label="Message your coach" onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(text); } }} />
        <button className="primary" disabled={busy || !text.trim()}>Send</button>
      </form>
    </main>
  );
}
