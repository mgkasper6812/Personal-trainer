"use client";
// Small tap-first input components shared by setup, check-in and the logger.

export function Chips<T extends string>({ options, value, onChange, multi = false, labels }: {
  options: readonly T[]; value: T[] | T | null; onChange: (v: T[] | T) => void; multi?: boolean; labels?: Partial<Record<T, string>>;
}) {
  const sel = Array.isArray(value) ? value : value ? [value] : [];
  return (
    <div className="chips">
      {options.map((o) => {
        const on = sel.includes(o);
        return (
          <button type="button" key={o} className={`chip ${on ? "on" : ""}`} aria-pressed={on}
            onClick={() => onChange(multi ? (on ? sel.filter((x) => x !== o) : [...sel, o]) : o)}>
            {labels?.[o] ?? o}
          </button>
        );
      })}
    </div>
  );
}

export function Segmented<T extends string | number>({ options, value, onChange, labels }: {
  options: readonly T[]; value: T | null; onChange: (v: T) => void; labels?: Partial<Record<string, string>>;
}) {
  return (
    <div className="segmented">
      {options.map((o) => (
        <button type="button" key={String(o)} className={value === o ? "on" : ""} onClick={() => onChange(o)}>
          {labels?.[String(o)] ?? String(o)}
        </button>
      ))}
    </div>
  );
}

export function Stepper({ value, onChange, step = 1, min = 0, max = 999, unit, decimals = 0 }: {
  value: number | null; onChange: (v: number | null) => void; step?: number; min?: number; max?: number; unit?: string; decimals?: number;
}) {
  const v = value ?? null;
  const set = (x: number) => onChange(Math.min(max, Math.max(min, Math.round(x * 10 ** decimals) / 10 ** decimals)));
  return (
    <div className="stepper">
      <button type="button" aria-label="decrease" onClick={() => v != null && set(v - step)}>−</button>
      <input inputMode="decimal" value={v ?? ""} placeholder="–"
        onChange={(e) => { const t = e.target.value; onChange(t === "" ? null : Number(t)); }} />
      {unit && <span className="unit">{unit}</span>}
      <button type="button" aria-label="increase" onClick={() => set((v ?? min) + step)}>+</button>
    </div>
  );
}

export function Scale({ value, onChange, low, high }: { value?: number; onChange: (n: number) => void; low: string; high: string }) {
  return (
    <div>
      <div className="scale">
        {[1, 2, 3, 4, 5].map((n) => (
          <button type="button" key={n} className={value === n ? "on" : ""} onClick={() => onChange(n)}>{n}</button>
        ))}
      </div>
      <div className="row between small muted"><span>{low}</span><span>{high}</span></div>
    </div>
  );
}

export function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="field">
      <div className="field-label">{label}</div>
      {hint && <div className="small muted" style={{ marginTop: -4, marginBottom: 6 }}>{hint}</div>}
      {children}
    </div>
  );
}

/** Simple responsive line chart (SVG). */
export function LineChart({ points, unit, lowerIsBetter = false }: { points: { x: string; y: number }[]; unit: string; lowerIsBetter?: boolean }) {
  if (points.length < 2) return <p className="small muted">Log this a couple more times to see a trend.</p>;
  const W = 340, H = 150, P = { l: 36, r: 8, t: 10, b: 20 };
  const ys = points.map((p) => p.y);
  let lo = Math.min(...ys), hi = Math.max(...ys);
  if (lo === hi) { lo -= 1; hi += 1; }
  const pad = (hi - lo) * 0.15; lo -= pad; hi += pad;
  const x = (i: number) => P.l + (i / (points.length - 1)) * (W - P.l - P.r);
  const y = (v: number) => P.t + (hi - v) / (hi - lo) * (H - P.t - P.b);
  const path = points.map((p, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y(p.y).toFixed(1)}`).join(" ");
  const best = lowerIsBetter ? Math.min(...ys) : Math.max(...ys);
  const fmt = (v: number) => (Math.abs(v) >= 100 ? Math.round(v) : Math.round(v * 10) / 10);
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="chart" role="img" aria-label={`Trend in ${unit}`}>
      {[lo + pad, (lo + hi) / 2, hi - pad].map((v, i) => (
        <g key={i}><line x1={P.l} x2={W - P.r} y1={y(v)} y2={y(v)} className="grid" /><text x={P.l - 4} y={y(v) + 4} textAnchor="end" className="axis">{fmt(v)}</text></g>
      ))}
      <path d={path} className="line" />
      {points.map((p, i) => <circle key={i} cx={x(i)} cy={y(p.y)} r={p.y === best ? 4.5 : 3} className={p.y === best ? "dot best" : "dot"} />)}
      <text x={P.l} y={H - 4} className="axis">{points[0].x.slice(5)}</text>
      <text x={W - P.r} y={H - 4} textAnchor="end" className="axis">{points[points.length - 1].x.slice(5)}</text>
    </svg>
  );
}
