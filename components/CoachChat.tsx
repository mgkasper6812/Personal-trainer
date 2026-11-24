"use client";
import { useEffect, useRef, useState } from "react";
import { api, localDate } from "@/lib/client";
import type { ChatLine } from "@/lib/chat";
import { IconCheck, IconImage } from "./icons";
import ScreenshotImport, { toDataUrl } from "./ScreenshotImport";

const SUGGEST = {
  parent: ["How am I doing this week?", "Make Thursday Zone 2 cardio", "I'm sore — adjust today", "What should I eat tonight?", "Log a protein shake for breakfast"],
  athlete: ["What should I focus on today?", "My arm feels off", "Swap today's lift — no gym access", "How do I raise my bat speed?"],
};

export default function CoachChat({ role }: { role: "parent" | "athlete" }) {
  const [lines, setLines] = useState<ChatLine[] | null>(null);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const end = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [image, setImage] = useState<string | null>(null); // a screenshot being imported as a workout
  const [photos, setPhotos] = useState<string[]>([]);       // photos to send with the next message
  const thumbs = useRef<Record<string, string[]>>({});       // photos you sent this visit, by message time

  async function pick(files: Iterable<File> | null | undefined) {
    const list = [...(files ?? [])].filter((f) => f.type.startsWith("image/") || /\.heic$/i.test(f.name));
    if (!list.length) return;
    const added: string[] = [];
    for (const f of list) {
      try { added.push(await toDataUrl(f, 1280)); } catch { setErr("Couldn't open one of those images."); }
    }
    setPhotos((p) => {
      const next = [...p, ...added];
      if (next.length > 4) setErr("Up to 4 photos per message — kept the first 4.");
      return next.slice(0, 4);
    });
  }
  useEffect(() => {
    const onPaste = (e: ClipboardEvent) => {
      const fs = [...(e.clipboardData?.files ?? [])].filter((x) => x.type.startsWith("image/"));
      if (fs.length) { e.preventDefault(); pick(fs); }
    };
    window.addEventListener("paste", onPaste);
    return () => window.removeEventListener("paste", onPaste);
  }, []);

  useEffect(() => {
    api<{ display: ChatLine[] }>("/api/chat").then((r) => {
      setLines(r.display);
      const say = new URLSearchParams(window.location.search).get("say");
      if (say) { window.history.replaceState(null, "", "/coach"); setTimeout(() => sendRef.current?.(say), 0); }
    }, (e) => setErr(e.message));
  }, []);
  useEffect(() => { end.current?.scrollIntoView({ behavior: "smooth" }); }, [lines, busy]);

  const sendRef = useRef<((m: string) => void) | null>(null);
  async function send(msg: string, withPhotos: string[] = []) {
    const t = msg.trim();
    if ((!t && !withPhotos.length) || busy) return;
    setErr(""); setBusy(true); setText(""); setPhotos([]);
    const localAt = new Date().toISOString();
    if (withPhotos.length) thumbs.current[localAt] = withPhotos;
    setLines((l) => [...(l ?? []), { role: "me", text: t, at: localAt, photos: withPhotos.length || undefined }]);
    try {
      const display = (await api<{ display: ChatLine[] }>("/api/chat", { body: { text: t, date: localDate(), images: withPhotos } })).display;
      if (withPhotos.length) {
        const mine = [...display].reverse().find((l) => l.role === "me" && l.photos);
        if (mine) { thumbs.current[mine.at] = withPhotos; delete thumbs.current[localAt]; }
      }
      setLines(display);
    } catch (e) { setErr((e as Error).message); setText(t); setPhotos(withPhotos); setLines((l) => (l ?? []).slice(0, -1)); }
    setBusy(false);
  }

  sendRef.current = send;
  const lastCoach = lines ? lines.length - 1 - [...lines].reverse().findIndex((l) => l.role === "coach") : -1;
  const KIND: Record<string, string> = { review: "Morning report", nudge: "Check-in", workout: "Workout feedback" };
  return (
    <main className="chat-page" style={photos.length ? { paddingBottom: "calc(env(safe-area-inset-bottom) + 290px)" } : undefined}>
      <h1 style={{ marginBottom: 4 }}>Coach</h1>
      <p className="small muted" style={{ marginTop: 0 }}>Ask anything, tell it what to change, or tap the photo button to send up to 4 photos — a plate, a menu, a nutrition label, or an Apple Fitness or Strava screenshot. {role === "athlete" ? "Your chats are private." : "Private to you."}</p>
      {!lines && !err && <p className="muted"><span className="spinner" />Loading…</p>}
      <div className="chat">
        {lines?.length === 0 && <div className="bubble coach">Hey — I know your plan, check-ins and progress. What do you need?</div>}
        {lines?.map((l, i) => (
          <div key={i} className={`bubble ${l.role} ${l.kind ? "proactive" : ""}`}>
            {l.kind && <span className="bubble-kind">{KIND[l.kind]}</span>}
            {l.photos ? (thumbs.current[l.at]
              ? <span className="bubble-photos">{thumbs.current[l.at].map((ph, j) => (/* eslint-disable-next-line @next/next/no-img-element */ <img key={j} src={ph} alt={`Photo ${j + 1} you sent`} />))}</span>
              : <span className="bubble-photo-note"><IconImage size={14} />{l.photos} photo{l.photos > 1 ? "s" : ""}</span>) : null}
            {l.text}
            {l.actions && <div className="chat-actions">{l.actions.map((a) => <span key={a} className="chat-action"><IconCheck size={14} />{a}</span>)}</div>}
            {i === lastCoach && !busy && l.replies && l.replies.length > 0 && (
              <div className="reply-chips">{l.replies.map((r) => <button key={r} className="chip" onClick={() => send(r)}>{r}</button>)}</div>
            )}
          </div>
        ))}
        {image && <ScreenshotImport image={image} onCancel={() => setImage(null)} onDone={(summary) => { setImage(null); send(`I logged a workout from a screenshot — ${summary}`); }} />}
        {busy && <div className="bubble coach muted"><span className="spinner" />Thinking…</div>}
        <div ref={end} />
      </div>
      {err && <p className="error">{err}</p>}
      {!busy && (lines?.length ?? 0) < 4 && !(lines?.[lastCoach]?.replies?.length) && (
        <div className="chips scroll-x" style={{ marginTop: 12 }}>
          {SUGGEST[role].map((s) => <button key={s} className="chip" onClick={() => send(s)}>{s}</button>)}
        </div>
      )}
      <form className="chat-composer" onSubmit={(e) => { e.preventDefault(); send(text, photos); }}>
        {photos.length > 0 && (
          <div className="composer-tray">
            <div className="photo-tray" style={{ marginTop: 0 }} aria-label="Photos to send">
              {photos.map((ph, i) => (
                <div key={i} className="tray-item">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={ph} alt={`Photo ${i + 1} to send`} />
                  <button type="button" aria-label={`Remove photo ${i + 1}`} onClick={() => setPhotos(photos.filter((_, j) => j !== i))}>×</button>
                </div>
              ))}
              {photos.length < 4 && <button type="button" className="tray-add" aria-label="Add another photo" onClick={() => fileRef.current?.click()}>+</button>}
            </div>
            <button type="button" className="link small" onClick={() => { setImage(photos[0]); setPhotos(photos.slice(1)); }}>
              Workout screenshot? Import {photos.length > 1 ? "the first one " : ""}as a workout
            </button>
          </div>
        )}
        <input ref={fileRef} type="file" accept="image/*" multiple hidden onChange={(e) => { pick(e.target.files); e.target.value = ""; }} />
        <button type="button" className="attach-btn" aria-label="Add photos (food, labels, workout screenshots)" onClick={() => fileRef.current?.click()}><IconImage size={22} /></button>
        <textarea rows={1} value={text} placeholder={photos.length ? "Ask about your photos (optional)" : "Message your coach"} aria-label="Message your coach" onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(text, photos); } }} />
        <button className="primary" disabled={busy || (!text.trim() && !photos.length)}>Send</button>
      </form>
    </main>
  );
}
