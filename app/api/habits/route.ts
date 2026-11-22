import { requireUser } from "@/lib/auth";
import { getCustomHabits, getHabitLog, saveCustomHabits, saveHabitLog } from "@/lib/data";
import { isDate } from "@/lib/dates";
import { bad, body, handle, ok } from "@/lib/http";

// Tick a habit for a day, or add / remove one of your own habits.
export const POST = handle(async (req) => {
  const me = await requireUser();
  if (me instanceof Response) return me;
  const b = await body<{ date: string; habit: string; done: boolean; add: string; remove: string }>(req);
  if (typeof b.add === "string" && b.add.trim()) {
    const list = await getCustomHabits(me.id);
    const name = b.add.trim().slice(0, 60);
    if (!list.includes(name)) await saveCustomHabits(me.id, [...list, name].slice(0, 12));
    return ok({ ok: true });
  }
  if (typeof b.remove === "string") {
    await saveCustomHabits(me.id, (await getCustomHabits(me.id)).filter((h) => h !== b.remove));
    return ok({ ok: true });
  }
  if (!isDate(b.date) || typeof b.habit !== "string" || !b.habit) return bad("Bad request");
  const done = new Set(await getHabitLog(me.id, b.date));
  if (b.done) done.add(b.habit.slice(0, 60)); else done.delete(b.habit);
  await saveHabitLog(me.id, b.date, [...done]);
  return ok({ done: [...done] });
});
