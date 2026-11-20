import { requireUser } from "@/lib/auth";
import { saveEvening } from "@/lib/data";
import { isDate } from "@/lib/dates";
import { bad, body, handle, ok } from "@/lib/http";
import type { EveningLog } from "@/lib/types";

export const POST = handle(async (req) => {
  const me = await requireUser();
  if (me instanceof Response) return me;
  const b = await body<{ date: string; value: EveningLog }>(req);
  if (!isDate(b.date) || !["plan", "bit", "off"].includes(b.value as string)) return bad("Bad request");
  await saveEvening(me.id, b.date, b.value as EveningLog);
  return ok({ evening: b.value });
});
