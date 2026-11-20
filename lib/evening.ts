// The coach's evening plan, in a shape that's easy to lay out on a phone.
export type EveningPlan = {
  beforeTv: string[];
  snackBudget: string | null;
  snackOptions: string[];
  ifThen: { craving: string; instead: string }[];
  afterCutoff: string | null;
  note: string | null;
};

const clean = (s: string) =>
  s.trim().replace(/\.$/, "").replace(/^(and|or)\s+/i, "").replace(/^have\s+(an?\s+)?(?!one\b)/i, "").replace(/\s+instead(?=[,.]|$)/i, "")
    .replace(/\bmy\b/g, "your").replace(/\bI'?ll\b/g, "you'll");
const cap = (s: string) => (s ? s[0].toUpperCase() + s.slice(1) : s);

/** Accepts the structured plan, or turns an older plain-text plan into the same shape. */
export function normalizeEvening(x: unknown): EveningPlan | null {
  if (!x) return null;
  if (typeof x === "object") return x as EveningPlan;
  if (typeof x !== "string") return null;
  const plan: EveningPlan = { beforeTv: [], snackBudget: null, snackOptions: [], ifThen: [], afterCutoff: null, note: null };
  const sentences = x.replace(/\s+/g, " ").split(/(?<=[.!])\s+(?=[A-Z])/).map((s) => s.trim()).filter(Boolean);
  for (let s of sentences) {
    s = s.replace(/^If-then plans:\s*/i, "");
    const ifThen = s.match(/^If I want (.+?), I'?ll (.+)$/i);
    if (ifThen) {
      const craving = clean(ifThen[1]);
      if (/after \d/i.test(craving) || /^a snack after/i.test(craving)) plan.afterCutoff = cap(clean(ifThen[2]));
      else plan.ifThen.push({ craving: cap(craving.replace(/^(an?|some)\s+/i, "")), instead: cap(clean(ifThen[2])) });
      continue;
    }
    const budget = s.match(/about ([\d–\-\s]+kcal)/i);
    if (budget) plan.snackBudget = budget[1].replace(/\s+/g, " ").trim();
    const opts = s.match(/^Choose an? [\w\s]*snack:\s*(.+)$/i);
    if (opts) {
      plan.snackOptions.push(...opts[1].split(/,\s*(?:or\s+)?|\s+or\s+/).map(clean).filter(Boolean).map((o) => cap(o.replace(/^an?\s+/i, ""))));
      continue;
    }
    const orHave = s.match(/^Or have (.+)$/i);
    if (orHave) { plan.snackOptions.push(cap(clean(orHave[1]))); continue; }
    if (/^Plan one snack/i.test(s)) continue;
    if (/^TV starts|kitchen closes at/i.test(s) && !/walk/i.test(s)) continue;
    if (/^Log it|no guilt/i.test(s)) { plan.note = [plan.note, s].filter(Boolean).join(" "); continue; }
    plan.beforeTv.push(cap(clean(s.replace(/^Before TV,\s*/i, "").replace(/^When you sit down,\s*(have\s+an?\s+)?/i, "When you sit down: "))));
  }
  return plan;
}
