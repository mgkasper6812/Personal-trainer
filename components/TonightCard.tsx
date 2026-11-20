"use client";
import { normalizeEvening } from "@/lib/evening";
import type { EveningLog } from "@/lib/types";
import { Segmented } from "./ui";

const t12 = (t: string | null) => {
  if (!t) return "";
  const [h, m] = t.split(":").map(Number);
  return `${((h + 11) % 12) + 1}:${String(m).padStart(2, "0")} ${h < 12 ? "am" : "pm"}`;
};

export default function TonightCard({ tvTime, kitchenCloses, swaps, plan, evening, onLog }: {
  tvTime: string | null; kitchenCloses: string | null; swaps: string[]; plan: unknown;
  evening?: EveningLog | null; onLog?: (v: EveningLog) => void;
}) {
  const p = normalizeEvening(plan);
  const snackOptions = p?.snackOptions.length ? p.snackOptions : swaps;
  return (
    <div className="card tonight">
      <h2>🌙 Tonight</h2>
      <div className="tiles">
        {tvTime && <div className="tile"><span>TV</span><b>{t12(tvTime)}</b></div>}
        {kitchenCloses && <div className="tile accent"><span>Kitchen closes</span><b>{t12(kitchenCloses)}</b></div>}
      </div>

      {p?.beforeTv.length ? (
        <section>
          <h3>Before TV</h3>
          <ul className="checks">{p.beforeTv.map((x) => <li key={x}>{x}</li>)}</ul>
        </section>
      ) : (
        <section><h3>Before TV</h3><ul className="checks"><li>Walk 10–15 minutes after dinner</li></ul></section>
      )}

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
              <div key={x.craving} className="ifthen-row">
                <b>{x.craving}</b><span aria-hidden>→</span><span>{x.instead}</span>
              </div>
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

      {onLog && (
        <section>
          <h3>How did the evening go?</h3>
          <Segmented options={["plan", "bit", "off"] as const} value={evening ?? null} onChange={onLog}
            labels={{ plan: "As planned", bit: "Snacked a bit", off: "Off plan" }} />
          <p className="small muted" style={{ marginTop: 8 }}>{p?.note ?? "Log it either way. No guilt, just data."}</p>
        </section>
      )}
    </div>
  );
}
