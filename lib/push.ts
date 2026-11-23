import * as webpush from "web-push";
import { listUsers } from "./auth";
import { getCheckIn, getEvening, getMealPlan, getProfile, getProgram, getRecipe } from "./data";
import { db } from "./db";
import { mondayOf } from "./dates";
import { normalizeEvening } from "./evening";
import type { User } from "./types";

export type PushPrefs = {
  subscriptions: webpush.PushSubscription[];
  tz: string; // IANA zone from the phone, e.g. America/Chicago
  morning: { on: boolean; time: string };
  evening: { on: boolean; time: string | null }; // null = 15 min before TV
};

// VAPID keys are generated once and kept in the database, so there's nothing to configure.
export async function vapid() {
  let k = await db().get<{ publicKey: string; privateKey: string }>("push:vapid");
  if (!k) {
    k = webpush.generateVAPIDKeys();
    await db().set("push:vapid", k);
  }
  return k;
}

export const getPrefs = async (uid: string): Promise<PushPrefs> =>
  (await db().get<PushPrefs>(`push:${uid}`)) ?? { subscriptions: [], tz: "America/New_York", morning: { on: true, time: "07:00" }, evening: { on: true, time: null } };
export const savePrefs = (uid: string, p: PushPrefs) => db().set(`push:${uid}`, p);

/** Local date and HH:MM for a time zone. */
export function localNow(tz: string, at = new Date()) {
  const parts = Object.fromEntries(new Intl.DateTimeFormat("en-CA", { timeZone: tz, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hour12: false })
    .formatToParts(at).map((p) => [p.type, p.value]));
  return { date: `${parts.year}-${parts.month}-${parts.day}`, minutes: (Number(parts.hour) % 24) * 60 + Number(parts.minute) };
}
const toMin = (t: string) => { const [h, m] = t.split(":").map(Number); return h * 60 + m; };
const t12 = (t: string) => { const [h, m] = t.split(":").map(Number); return `${((h + 11) % 12) + 1}:${String(m).padStart(2, "0")}${h < 12 ? "am" : "pm"}`; };

export async function send(uid: string, payload: { title: string; body: string; url: string; tag: string }) {
  const prefs = await getPrefs(uid);
  if (!prefs.subscriptions.length) return 0;
  const k = await vapid();
  const subject = process.env.VAPID_SUBJECT ?? (process.env.APP_URL ? process.env.APP_URL : "https://family-trainer.vercel.app");
  let sent = 0;
  const keep: webpush.PushSubscription[] = [];
  for (const sub of prefs.subscriptions) {
    try {
      await webpush.sendNotification(sub, JSON.stringify(payload), { vapidDetails: { subject, publicKey: k.publicKey, privateKey: k.privateKey }, TTL: 3600 });
      sent++; keep.push(sub);
    } catch (e) {
      const code = (e as { statusCode?: number }).statusCode;
      if (code !== 404 && code !== 410) keep.push(sub); // 404/410 = the phone unsubscribed; drop it
      else console.warn("push: dropping expired subscription");
    }
  }
  if (keep.length !== prefs.subscriptions.length) await savePrefs(uid, { ...prefs, subscriptions: keep });
  return sent;
}

export async function morningMessage(user: User, date: string) {
  const [profile, rec, checkIn] = await Promise.all([getProfile(user.id), getProgram(user.id), getCheckIn(user.id, date)]);
  if (!rec) return null;
  const dow = new Date(`${date}T12:00:00Z`).getUTCDay();
  const slot = date < rec.startDate ? null : rec.program.schedule.find((s) => s.dayOfWeek === dow);
  const rt = slot?.routineKey ? rec.program.routines.find((r) => r.key === slot.routineKey) : null;
  const parts = [rt ? `Today: ${rt.name} · ~${rt.estMinutes} min.` : `Today: ${slot?.note ?? "rest day"}.`];
  if (!checkIn) parts.push("Check in first — 30 sec.");
  if (profile?.kind === "adult") {
    const plan = await getMealPlan(user.id, mondayOf(date));
    const rid = plan.days[date];
    const r = rid ? await getRecipe(rid) : null;
    if (r) parts.push(`Dinner: ${r.title}.`);
  }
  return { title: `Morning, ${user.name}`, body: parts.join(" "), url: "/today", tag: `morning-${date}` };
}

export async function eveningMessage(user: User, date: string) {
  const [profile, rec, logged] = await Promise.all([getProfile(user.id), getProgram(user.id), getEvening(user.id, date)]);
  if (profile?.kind !== "adult" || logged) return null; // already logged tonight: no nudge
  const plan = normalizeEvening(rec?.program.nutrition?.eveningPlan);
  const snack = plan?.snackOptions[0] ?? profile.eveningSwaps[0];
  const swap = plan?.ifThen[0];
  const parts = [`TV at ${t12(profile.tvTime)}${profile.kitchenCloses ? ` — kitchen closes ${t12(profile.kitchenCloses)}` : ""}.`];
  if (snack) parts.push(`Your snack: ${snack}.`);
  if (swap) parts.push(`Craving ${swap.craving.toLowerCase()}? ${swap.instead}.`);
  return { title: "Tonight's plan", body: parts.join(" "), url: "/today", tag: `evening-${date}` };
}

/** Called every ~15 min: send anything due (once per person, per kind, per day; skip if more than 2 h late). */
export async function dispatch(now = new Date()) {
  const results: string[] = [];
  for (const user of await listUsers()) {
    const prefs = await getPrefs(user.id);
    if (!prefs.subscriptions.length) continue;
    const { date, minutes } = localNow(prefs.tz, now);
    const profile = await getProfile(user.id);
    const due: { kind: "morning" | "evening"; at: number }[] = [];
    if (prefs.morning.on) due.push({ kind: "morning", at: toMin(prefs.morning.time) });
    if (prefs.evening.on && profile?.kind === "adult") {
      const at = prefs.evening.time ? toMin(prefs.evening.time) : Math.max(0, toMin(profile.tvTime) - 15);
      due.push({ kind: "evening", at });
    }
    for (const d of due) {
      if (minutes < d.at || minutes > d.at + 120) continue;
      const key = `pushsent:${user.id}:${d.kind}:${date}`;
      if (await db().get(key)) continue;
      const msg = d.kind === "morning" ? await morningMessage(user, date) : await eveningMessage(user, date);
      await db().set(key, true); // mark first so a slow send can't double-fire
      if (msg) results.push(`${user.name}:${d.kind}:${await send(user.id, msg)}`);
    }
  }
  return results;
}
