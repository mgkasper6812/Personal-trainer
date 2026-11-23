"use client";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";

const KEY = "ft-nav-depth";

/** Counts in-app page changes for this tab, so Back knows whether there's somewhere to go back to. */
export function NavTracker() {
  const path = usePathname();
  useEffect(() => {
    try { sessionStorage.setItem(KEY, String(Number(sessionStorage.getItem(KEY) ?? "0") + 1)); } catch {}
  }, [path]);
  return null;
}

/** ‹ Back: returns to the previous screen in the app, or to `fallback` when opened directly (e.g. from a notification). */
export default function BackButton({ fallback, label = "Back", onBeforeLeave }: { fallback: string; label?: string; onBeforeLeave?: () => void }) {
  const router = useRouter();
  function go() {
    onBeforeLeave?.();
    let depth = 0;
    try { depth = Number(sessionStorage.getItem(KEY) ?? "0"); } catch {}
    if (depth > 1 && window.history.length > 1) {
      try { sessionStorage.setItem(KEY, String(depth - 2)); } catch {} // the tracker adds one back on arrival
      router.back();
    } else router.push(fallback);
  }
  return (
    <button type="button" className="back-btn" onClick={go} aria-label={label === "Back" ? "Go back" : label}>
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m15 18-6-6 6-6" /></svg>
      {label}
    </button>
  );
}
