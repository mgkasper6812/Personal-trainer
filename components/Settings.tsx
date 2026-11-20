"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { api } from "@/lib/client";
import { SHORTCUT_NAME } from "./WorkoutDetail";

export default function Settings({ name, role }: { name: string; role: "parent" | "athlete" }) {
  const [token, setToken] = useState("");
  const [origin, setOrigin] = useState("");
  const [copied, setCopied] = useState("");
  useEffect(() => {
    setOrigin(window.location.origin);
    api<{ token: string }>("/api/health/token").then((r) => setToken(r.token), () => {});
  }, []);
  const copy = async (label: string, text: string) => { try { await navigator.clipboard.writeText(text); setCopied(label); setTimeout(() => setCopied(""), 1500); } catch {} };
  const url = `${origin}/api/health`;

  return (
    <main>
      <h1>Settings</h1>
      <div className="card">
        <h2>{name}</h2>
        <p className="small"><Link href="/onboarding">Edit my setup answers</Link> · <Link href="/routines">Rebuild my program</Link></p>
        {role === "parent" && <p className="small"><Link href="/family">Family &amp; alerts</Link></p>}
      </div>

      <div className="card" id="watch">
        <h2>⌚ Apple Watch sync</h2>
        <p className="small">How it works: start a <b>Traditional Strength Training</b> (or Walk) workout on your Watch, log your sets here on your phone, and end both when you&apos;re done. On the workout summary, tap <b>Add Watch data</b> — a Shortcut reads heart rate and calories from Apple Health and sends them here.</p>
        <p className="small"><b>One-time setup (about 2 minutes) in the Shortcuts app:</b></p>
        <ol className="small steps">
          <li>Tap <b>+</b> to make a new shortcut. Name it exactly <b>{SHORTCUT_NAME}</b>.</li>
          <li>Add <b>Get Dictionary from Input</b> (input = Shortcut Input).</li>
          <li>Add <b>Get Dictionary Value</b> → key <code>start</code>, then <b>Get Dates from Input</b>. Repeat for key <code>end</code>.</li>
          <li>Add <b>Find Health Samples</b>: Type <b>Heart Rate</b>, Start Date <b>is after</b> the start date, and <b>is before</b> the end date.</li>
          <li>Add <b>Calculate Statistics</b> → <b>Average</b> of those samples. Add another → <b>Maximum</b>.</li>
          <li>Add <b>Find Health Samples</b>: Type <b>Active Energy</b>, same dates, then <b>Calculate Statistics → Sum</b>.</li>
          <li>Add <b>Get Contents of URL</b>: URL below, Method <b>POST</b>, Request Body <b>JSON</b> with fields:
            <code>token</code> (your token below), <code>kind</code> = <code>workout</code>, <code>workoutId</code> (Dictionary Value for key <code>id</code>),
            <code>avgHR</code>, <code>maxHR</code>, <code>calories</code> (the three statistics).</li>
          <li>Run it once from a workout summary and tap <b>Allow</b> for Health access.</li>
        </ol>
        <label>URL<div className="row" style={{ flexWrap: "nowrap" }}><input readOnly value={url} /><button onClick={() => copy("url", url)}>{copied === "url" ? "✓" : "Copy"}</button></div></label>
        <label style={{ marginTop: 10 }}>Your token (keep private)<div className="row" style={{ flexWrap: "nowrap" }}><input readOnly value={token} /><button onClick={() => copy("token", token)}>{copied === "token" ? "✓" : "Copy"}</button></div></label>
        <p className="small muted">Smart scale: make a second shortcut (or a daily Personal Automation) with <b>Find Health Samples</b> → Type <b>Weight</b>, Limit 1, sorted latest first, then POST JSON <code>{"{token, kind: \"weight\", lb}"}</code> to the same URL.</p>
        <button className="link small" onClick={async () => { if (confirm("Make a new token? Your Shortcut will need the new one.")) setToken((await api<{ token: string }>("/api/health/token", { body: {} })).token); }}>Reset token</button>
      </div>

      <div className="card">
        <h2>About</h2>
        <p className="small muted">General fitness guidance, not medical advice. {role === "parent" ? "Your doctor leads on A1C targets and medications." : "Pain means stop and tell your dad."}</p>
      </div>
      <button className="wide" onClick={async () => { await api("/api/logout", { body: {} }); window.location.href = "/login"; }}>Sign out</button>
    </main>
  );
}
