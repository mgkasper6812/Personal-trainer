"use client";
import { useEffect, useState } from "react";
import { api } from "@/lib/client";
import { Segmented } from "./ui";

type Prefs = { tz: string; morning: { on: boolean; time: string }; evening: { on: boolean; time: string | null }; devices: number };

function keyToBytes(b64: string) {
  const pad = "=".repeat((4 - (b64.length % 4)) % 4);
  const raw = atob((b64 + pad).replace(/-/g, "+").replace(/_/g, "/"));
  return Uint8Array.from(raw, (c) => c.charCodeAt(0));
}

export default function NotificationSettings({ role }: { role: "parent" | "athlete" }) {
  const [prefs, setPrefs] = useState<Prefs | null>(null);
  const [key, setKey] = useState("");
  const [state, setState] = useState<"unsupported" | "needs-install" | "denied" | "off" | "on">("off");
  const [msg, setMsg] = useState("");
  const tz = typeof Intl !== "undefined" ? Intl.DateTimeFormat().resolvedOptions().timeZone : "America/New_York";

  useEffect(() => {
    api<{ publicKey: string; prefs: Prefs }>("/api/push").then((r) => { setKey(r.publicKey); setPrefs(r.prefs); }, () => {});
    const standalone = window.matchMedia("(display-mode: standalone)").matches || (navigator as Navigator & { standalone?: boolean }).standalone;
    const ios = /iPhone|iPad|iPod/.test(navigator.userAgent);
    if (!("serviceWorker" in navigator) || !("PushManager" in window) || !("Notification" in window)) setState(ios && !standalone ? "needs-install" : "unsupported");
    else if (Notification.permission === "denied") setState("denied");
    else navigator.serviceWorker.ready.then((r) => r.pushManager.getSubscription()).then((s) => setState(s ? "on" : "off"));
  }, []);

  async function enable() {
    setMsg("");
    try {
      const perm = await Notification.requestPermission(); // must follow a tap on iPhone
      if (perm !== "granted") { setState(perm === "denied" ? "denied" : "off"); return; }
      const reg = await navigator.serviceWorker.ready;
      const sub = (await reg.pushManager.getSubscription()) ?? (await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: keyToBytes(key) }));
      await api("/api/push", { body: { action: "subscribe", subscription: sub.toJSON(), tz } });
      setState("on");
      setMsg("Notifications are on for this phone.");
    } catch (e) { setMsg((e as Error).message); }
  }
  async function disable() {
    const reg = await navigator.serviceWorker.ready;
    const sub = await reg.pushManager.getSubscription();
    await api("/api/push", { body: { action: "unsubscribe", subscription: sub?.toJSON() } });
    await sub?.unsubscribe();
    setState("off");
  }
  async function save(p: Prefs) {
    setPrefs(p);
    await api("/api/push", { body: { action: "settings", morning: p.morning, evening: p.evening, tz } }).catch((e) => setMsg(e.message));
  }
  async function test() {
    const r = await api<{ sent: number }>("/api/push", { body: { action: "test" } });
    setMsg(r.sent ? "Sent — check your notifications." : "No phone is subscribed yet.");
  }

  return (
    <div className="card" id="notifications">
      <h2>Notifications</h2>
      {state === "needs-install" && <p className="small">On iPhone, notifications only work from the Home Screen app: tap Share → <b>Add to Home Screen</b>, open it from there, then come back here.</p>}
      {state === "unsupported" && <p className="small muted">This browser can&apos;t receive notifications. Use the Home Screen app on iPhone (iOS 16.4 or later).</p>}
      {state === "denied" && <p className="small">Notifications are blocked. iPhone Settings → Notifications → <b>Trainer</b> → Allow Notifications.</p>}
      {state === "off" && <button className="primary wide" onClick={enable} disabled={!key}>Turn on notifications</button>}
      {state === "on" && prefs && (<>
        <div className="field">
          <div className="field-label">Morning plan</div>
          <div className="row" style={{ flexWrap: "nowrap" }}>
            <Segmented options={["on", "off"]} value={prefs.morning.on ? "on" : "off"} onChange={(v) => save({ ...prefs, morning: { ...prefs.morning, on: v === "on" } })} labels={{ on: "On", off: "Off" }} />
            <input type="time" value={prefs.morning.time} onChange={(e) => e.target.value && save({ ...prefs, morning: { ...prefs.morning, time: e.target.value } })} style={{ maxWidth: 140 }} aria-label="Morning notification time" />
          </div>
          <p className="small muted">Today&apos;s workout, a check-in reminder{role === "parent" ? " and tonight's dinner" : ""}.</p>
        </div>
        {role === "parent" && (
          <div className="field">
            <div className="field-label">Evening nudge</div>
            <div className="row" style={{ flexWrap: "nowrap" }}>
              <Segmented options={["on", "off"]} value={prefs.evening.on ? "on" : "off"} onChange={(v) => save({ ...prefs, evening: { ...prefs.evening, on: v === "on" } })} labels={{ on: "On", off: "Off" }} />
              <input type="time" value={prefs.evening.time ?? ""} placeholder="15 min before TV" onChange={(e) => save({ ...prefs, evening: { ...prefs.evening, time: e.target.value || null } })} style={{ maxWidth: 140 }} aria-label="Evening nudge time" />
            </div>
            <p className="small muted">{prefs.evening.time ? "" : "Sent 15 minutes before your TV time. "}Kitchen-close time and your snack plan. Skipped if you&apos;ve already logged the evening.</p>
          </div>
        )}
        <div className="row" style={{ flexWrap: "nowrap" }}>
          <button style={{ flexGrow: 1 }} onClick={test}>Send a test</button>
          <button onClick={disable}>Turn off</button>
        </div>
        <p className="small muted" style={{ marginBottom: 0 }}>Times are in {prefs.tz.replace("_", " ")}. They can arrive a few minutes late.</p>
      </>)}
      {msg && <p className="small" style={{ color: "var(--accent)" }}>{msg}</p>}
    </div>
  );
}
