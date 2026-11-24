import { requireUser } from "@/lib/auth";
import { bad, body, handle, ok } from "@/lib/http";
import { getPrefs, savePrefs, send, vapid, type PushPrefs } from "@/lib/push";

const HHMM = /^([01]\d|2[0-3]):[0-5]\d$/;

export const GET = handle(async () => {
  const me = await requireUser();
  if (me instanceof Response) return me;
  const [k, prefs] = await Promise.all([vapid(), getPrefs(me.id)]);
  return ok({ publicKey: k.publicKey, prefs: { ...prefs, subscriptions: undefined, devices: prefs.subscriptions.length }, role: me.role });
});

// actions: subscribe (with the browser's subscription + time zone), unsubscribe, settings, test
export const POST = handle(async (req) => {
  const me = await requireUser();
  if (me instanceof Response) return me;
  const b = await body<{ action: string; subscription: PushPrefs["subscriptions"][number]; tz: string; morning: PushPrefs["morning"]; midday: PushPrefs["morning"]; evening: PushPrefs["evening"] }>(req);
  const prefs = await getPrefs(me.id);
  if (typeof b.tz === "string" && b.tz.length < 60) {
    try { new Intl.DateTimeFormat("en-US", { timeZone: b.tz }); prefs.tz = b.tz; } catch {}
  }
  if (b.action === "subscribe") {
    const s = b.subscription;
    if (!s || typeof s.endpoint !== "string" || !/^https:\/\//.test(s.endpoint) || !s.keys?.p256dh || !s.keys?.auth) return bad("Bad subscription");
    prefs.subscriptions = [...prefs.subscriptions.filter((x) => x.endpoint !== s.endpoint), { endpoint: s.endpoint, keys: { p256dh: s.keys.p256dh, auth: s.keys.auth } }].slice(-5);
  } else if (b.action === "unsubscribe") {
    const ep = b.subscription?.endpoint;
    prefs.subscriptions = ep ? prefs.subscriptions.filter((x) => x.endpoint !== ep) : [];
  } else if (b.action === "settings") {
    if (b.morning && typeof b.morning.on === "boolean" && HHMM.test(b.morning.time)) prefs.morning = { on: b.morning.on, time: b.morning.time };
    if (b.midday && typeof b.midday.on === "boolean" && HHMM.test(b.midday.time)) prefs.midday = { on: b.midday.on, time: b.midday.time };
    if (b.evening && typeof b.evening.on === "boolean") prefs.evening = { on: b.evening.on, time: b.evening.time && HHMM.test(b.evening.time) ? b.evening.time : null };
  } else if (b.action === "test") {
    const n = await send(me.id, { title: "Family Trainer", body: "Notifications are working. See you in the morning.", url: "/today", tag: "test" });
    return ok({ sent: n });
  } else return bad("Unknown action");
  await savePrefs(me.id, prefs);
  return ok({ ok: true, devices: prefs.subscriptions.length });
});
