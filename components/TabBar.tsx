"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { localDate } from "@/lib/client";
import type { Routine } from "@/lib/schemas";
import { fmtClock, loadActive, startWorkout } from "@/lib/workout-client";
import { IconChart, IconFork, IconHome, IconPlus, IconTrain, IconUser } from "./icons";

/** Center Start: resume a workout in progress, else start today's routine, else an empty workout. */
export async function startToday() {
  if (loadActive()) { window.location.href = "/workout"; return; }
  const date = localDate();
  try {
    const r = await fetch(`/api/today?date=${date}`);
    const d = (await r.json()) as { routine: Routine | null; workoutsToday: unknown[]; program: { weekInfo: { deload: boolean } | null } | null };
    if (d.routine && !d.workoutsToday?.length) return startWorkout(d.routine, date, !!d.program?.weekInfo?.deload);
  } catch {}
  return startWorkout(null, date);
}

export default function TabBar({ role }: { role: "parent" | "athlete" }) {
  const path = usePathname();
  const [active, setActive] = useState<{ name: string; startedAt: string } | null>(null);
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    setActive(loadActive());
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  const on = (p: string[]) => (p.some((x) => path.startsWith(x)) ? "on" : "");
  return (
    <>
      {active && (
        <Link href="/workout" className="active-bar">
          <span className="dot" />
          <span style={{ flexGrow: 1 }}>{active.name} in progress</span>
          <span className="display">{fmtClock((now - Date.parse(active.startedAt)) / 1000)}</span>
          <span>Resume ›</span>
        </Link>
      )}
      <nav className="tabbar" aria-label="Main">
        <Link href="/today" className={on(["/today"])}><IconHome />Home</Link>
        <Link href="/routines" className={on(["/routines", "/exercise"])}><IconTrain />Train</Link>
        <button className="fab" aria-label={active ? "Resume workout" : "Start today's workout"} onClick={startToday}><IconPlus size={28} /></button>
        {role === "parent"
          ? <Link href="/meals" className={on(["/meals"])}><IconFork />Meals</Link>
          : <Link href="/progress" className={on(["/progress", "/history"])}><IconChart />Progress</Link>}
        <Link href="/me" className={on(role === "parent" ? ["/me", "/family", "/settings", "/progress", "/history"] : ["/me", "/family", "/settings"])}><IconUser />Me</Link>
      </nav>
    </>
  );
}
