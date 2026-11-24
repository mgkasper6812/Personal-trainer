"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { fmtClock, loadActive } from "@/lib/workout-client";
import { IconChart, IconChat, IconFork, IconHome, IconPlus, IconTrain } from "./icons";
import LogSheet, { openLog } from "./LogSheet";

export default function TabBar({ role }: { role: "parent" | "athlete" }) {
  const path = usePathname();
  const [active, setActive] = useState<{ name: string; startedAt: string } | null>(null);
  const [now, setNow] = useState(Date.now());
  const [unread, setUnread] = useState(0);
  useEffect(() => {
    if (path.startsWith("/coach")) { setUnread(0); return; }
    fetch("/api/chat?unread=1").then((r) => (r.ok ? r.json() : { unread: 0 })).then((x) => setUnread(x.unread ?? 0), () => {});
  }, [path]);
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
        <button className="fab" aria-label="Log food, weight, workout and more" onClick={() => openLog()}><IconPlus size={28} /></button>
        {role === "parent"
          ? <Link href="/meals" className={on(["/meals"])}><IconFork />Meals</Link>
          : <Link href="/progress" className={on(["/progress", "/history"])}><IconChart />Progress</Link>}
        <Link href="/coach" className={on(["/coach"])} aria-label={unread ? `Coach, ${unread} new` : "Coach"}>
          <span className="tab-badge-wrap"><IconChat />{unread > 0 && <span className="tab-badge">{unread > 9 ? "9+" : unread}</span>}</span>Coach
        </Link>
      </nav>
      <LogSheet role={role} />
    </>
  );
}
