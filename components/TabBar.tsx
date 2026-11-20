"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function TabBar({ role }: { role: "parent" | "athlete" }) {
  const path = usePathname();
  const tabs = [
    { href: "/today", label: "Today", icon: "☀︎" },
    { href: "/routines", label: "Workout", icon: "🏋︎" },
    { href: "/history", label: "History", icon: "📈" },
    ...(role === "parent" ? [{ href: "/family", label: "Family", icon: "👪" }] : []),
    { href: "/settings", label: "Settings", icon: "⚙︎" },
  ];
  return (
    <nav className="tabbar">
      {tabs.map((t) => (
        <Link key={t.href} href={t.href} className={path.startsWith(t.href) ? "on" : ""}>
          <span className="tab-icon" aria-hidden>{t.icon}</span>{t.label}
        </Link>
      ))}
    </nav>
  );
}
