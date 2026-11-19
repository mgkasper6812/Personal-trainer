export const isDate = (s: unknown): s is string => typeof s === "string" && /^\d{4}-\d{2}-\d{2}$/.test(s);

const parse = (d: string) => new Date(`${d}T12:00:00Z`);
const fmt = (d: Date) => d.toISOString().slice(0, 10);

export function addDays(d: string, n: number) {
  const x = parse(d);
  x.setUTCDate(x.getUTCDate() + n);
  return fmt(x);
}
export const daysBetween = (a: string, b: string) => Math.round((parse(b).getTime() - parse(a).getTime()) / 86400000);
export const weekdayName = (d: string) => parse(d).toLocaleDateString("en-US", { weekday: "long", timeZone: "UTC" });
/** Monday on or before the given date. */
export function mondayOf(d: string) {
  const dow = parse(d).getUTCDay();
  return addDays(d, -((dow + 6) % 7));
}
