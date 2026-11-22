"use client";
import Link from "next/link";
import { useState } from "react";
import { normalizeEvening } from "@/lib/evening";
import type { EveningLog } from "@/lib/types";
import { IconMoon } from "./icons";
import { Segmented } from "./ui";

const t12 = (t: string | null) => {
  if (!t) return "";
  const [h, m] = t.split(":").map(Number);
  return `${((h + 11) % 12) + 1}:${String(m).padStart(2, "0")} ${h < 12 ? "am" : "pm"}`;
};

export default function TonightCard({ tvTime, kitchenCloses, swaps, plan, evening, onLog, collapsible = false, dinner = null }: {
  dinner?: { id: string; title: string; timeMin: number; plateTip: string } | null;
  tvTime: string | null; kitchenCloses: string | null; swaps: string[]; plan: unknown;
  evening?: EveningLog | null; onLog?: (v: EveningLog) => void; collapsible?: boolean;
}) {
  const [open, setOpen] = useState(!collapsible);
  const p = normalizeEvening(plan);
  const snackOptions = p?.snackOptions.length ? p.snackOptions : swaps;
  return (
    <section className="card tonight">
      <div className="row between">
        <h2 className="row" style={{ margin: 0, gap: 8 }}><IconMoon size={20} />Tonight</h2>
        {collapsible && <button className="link small" onClick={() => setOpen(!open)} aria-expanded={open}>{open ? "Hide plan" : "Show plan ›"}</button>}
      </div>
      {dinner !== undefined && collapsible && (
        dinner ? (
          <Link href={`/meals/${dinner.id}`} className="dinner-row">
            <span className="eyebrow">Dinner · {dinner.timeMin} min</span>
            <b className="display">{dinner.title}</b>
            <span className="small muted">{dinner.plateTip}</span>
          </Link>
        ) : onLog ? <Link href="/meals" className="dinner-row empty"><span className="small">No dinner planned — pick one ›</span></Link> : null
      )}
      {(tvTime || kitchenCloses) && (
        <div className="tiles" style={{ marginTop: 12 }}>
          {tvTime && <div className="tile"><span>TV</span><b className="display">{t12(tvTime)}</b></div>}
          {kitchenCloses && <div className="tile accent"><span>Kitchen closes</span><b className="display">{t12(kitchenCloses)}</b></div>}
        </div>
      )}
      {!open && snackOptions.length > 0 && (
        <p className="small muted" style={{ margin: "12px 0 0" }}>Snack: <b style={{ color: "var(--text)" }}>{snackOptions[0]}</b>{snackOptions.length > 1 ? ` or ${snackOptions.length - 1} more` : ""}</p>
      )}

      {open && (<>
        <section>
          <h3>Before TV</h3>
          <ul className="checks">{(p?.beforeTv.length ? p.beforeTv : ["Walk 10–15 minutes after dinner"]).map((x) => <li key={x}>{x}</li>)}</ul>
        </section>
        {snackOptions.length > 0 && (
          <section>
            <h3>Your one snack{p?.snackBudget ? <span className="muted"> · {p.snackBudget}</span> : null}</h3>
            <div className="chips">{snackOptions.map((x) => <span key={x} className="chip static">{x}</span>)}</div>
          </section>
        )}
        {p && p.ifThen.length > 0 && (
          <section>
            <h3>If you&apos;re craving…</h3>
            <div className="ifthen">
              {p.ifThen.map((x) => (
                <div key={x.craving} className="ifthen-row"><b>{x.craving}</b><span aria-hidden>→</span><span>{x.instead}</span></div>
              ))}
            </div>
          </section>
        )}
        {p?.afterCutoff && (
          <section className="cutoff">
            <h3>After {kitchenCloses ? t12(kitchenCloses) : "the kitchen closes"}</h3>
            <p>{p.afterCutoff}</p>
          </section>
        )}
      </>)}

      {onLog && (
        <section>
          <h3>How did the evening go?</h3>
          <Segmented options={["plan", "bit", "off"] as const} value={evening ?? null} onChange={onLog}
            labels={{ plan: "As planned", bit: "Snacked a bit", off: "Off plan" }} />
          {open && <p className="small muted" style={{ marginTop: 8, marginBottom: 0 }}>{p?.note ?? "Log it either way. No guilt, just data."}</p>}
        </section>
      )}
    </section>
  );
}
