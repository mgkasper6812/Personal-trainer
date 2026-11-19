"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function TabBar({ role }: { role: "parent" | "athlete" }) {
  const path = usePathname();
  const tabs = [
    { href: "/today", label: "Today" },
    { href: "/program", label: "Program" },
    ...(role === "parent" ? [{ href: "/family", label: "Family" }] : []),
  ];
  return (
    <nav className="tabbar">
      {tabs.map((t) => (
        <Link key={t.href} href={t.href} className={path.startsWith(t.href) ? "on" : ""}>
          {t.label}
        </Link>
      ))}
    </nav>
  );
}
