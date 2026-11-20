"use client";
import { useEffect, useRef, useState } from "react";
import { api, localDate } from "@/lib/client";

type Line = { role: "coach" | "me"; text: string };
type Res = { display: Line[]; complete: boolean; built?: boolean; hasProgram?: boolean; name?: string; stage?: string };

export default function Onboarding({ viewUser }: { viewUser: string | null }) {
  const [lines, setLines] = useState<Line[]>([]);
  const [complete, setComplete] = useState(false);
  const [built, setBuilt] = useState(false);
  const [name, setName] = useState("");
  const [text, setText] = useState("");
  const [busy, setBusy] = useState<"" | "thinking" | "building">("thinking");
  const [err, setErr] = useState("");
  const end = useRef<HTMLDivElement>(null);

  useEffect(() => {
    (async () => {
      try {
        const r = await api<Res>(`/api/onboarding${viewUser ? `?user=${viewUser}` : ""}`);
        setName(r.name ?? "");
        setLines(r.display);
        setComplete(r.complete);
        setBuilt(!!r.hasProgram);
        if (viewUser) return setBusy("");
        if (!r.display.length) await send("start");
        else if (r.complete && !r.hasProgram) await send("build");
        else setBusy("");
      } catch (e) {
        setErr((e as Error).message);
        setBusy("");
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    end.current?.scrollIntoView({ behavior: "smooth" });
  }, [lines, busy]);

  async function send(action: "start" | "reply" | "build", msg?: string) {
    setErr("");
    setBusy(action === "build" ? "building" : "thinking");
    if (msg) setLines((l) => [...l, { role: "me", text: msg }]);
    try {
      const r = await api<Res>("/api/onboarding", { body: { action, text: msg, date: localDate() } });
      setLines(r.display);
      setComplete(r.complete);
      setBuilt(!!r.built);
      if (r.complete && !r.built) return send("build"); // profile step, then program step
    } catch (e) {
      setErr((e as Error).message);
      if (msg) setText(msg);
      if (msg) setLines((l) => l.slice(0, -1));
    }
    setBusy("");
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const msg = text.trim();
    if (!msg || busy) return;
    setText("");
    send("reply", msg);
  }

  return (
    <main>
      <h1>{viewUser ? `${name}'s setup chat` : "Meet your coach"}</h1>
      {!viewUser && !lines.length && <p className="muted">A few questions so your coach can build your program.</p>}
      <div className="chat">
        {lines.map((l, i) => (
          <div key={i} className={`bubble ${l.role}`}>{l.text}</div>
        ))}
        {busy && (
          <div className="bubble coach muted">
            <span className="spinner" />
            {busy === "building" ? "Building your program — this takes a minute…" : "…"}
          </div>
        )}
        <div ref={end} />
      </div>
      {err && <p className="error">{err} {complete && !built && <button className="link" onClick={() => send("build")}>Try again</button>}</p>}
      {viewUser ? (
        <p><a href="/family">← Back to Family</a></p>
      ) : built ? (
        <div className="card" style={{ marginTop: 16 }}>
          <h2>Your program is ready.</h2>
          <button className="primary" onClick={() => (window.location.href = "/today")}>See today&apos;s plan</button>
        </div>
      ) : (
        (!complete || (!!err && !busy)) && (
          <form className="composer" onSubmit={submit}>
            <textarea rows={2} value={text} onChange={(e) => setText(e.target.value)} placeholder="Type your answer…"
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) submit(e); }} />
            <button className="primary" disabled={!!busy || !text.trim()}>Send</button>
          </form>
        )
      )}
    </main>
  );
}
