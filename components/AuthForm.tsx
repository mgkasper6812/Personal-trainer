"use client";
import { useState } from "react";
import { api } from "@/lib/client";

export default function AuthForm({ mode }: { mode: "setup" | "login" }) {
  const [f, setF] = useState({ name: "", username: "", password: "" });
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement>) => setF({ ...f, [k]: e.target.value });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErr("");
    try {
      await api(mode === "setup" ? "/api/setup" : "/api/login", { body: f });
      window.location.href = "/";
    } catch (e) {
      setErr((e as Error).message);
      setBusy(false);
    }
  }

  return (
    <main>
      <h1>{mode === "setup" ? "Set up Family Trainer" : "Sign in"}</h1>
      {mode === "setup" && <p className="muted">Create the parent account. You'll add Maicie's login next.</p>}
      <form className="card" onSubmit={submit} style={{ display: "grid", gap: 12 }}>
        {mode === "setup" && (
          <label>Your first name<input value={f.name} onChange={set("name")} autoComplete="given-name" required /></label>
        )}
        <label>Username<input value={f.username} onChange={set("username")} autoCapitalize="none" autoComplete="username" required /></label>
        <label>Password
          <input type="password" value={f.password} onChange={set("password")} autoComplete={mode === "setup" ? "new-password" : "current-password"} required minLength={6} />
        </label>
        {err && <p className="error">{err}</p>}
        <button className="primary" disabled={busy}>{busy ? "…" : mode === "setup" ? "Create account" : "Sign in"}</button>
      </form>
    </main>
  );
}
