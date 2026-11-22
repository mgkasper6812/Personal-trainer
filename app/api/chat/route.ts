import { requireUser } from "@/lib/auth";
import { chatTurn, getChat } from "@/lib/chat";
import { isDate } from "@/lib/dates";
import { bad, body, handle, ok } from "@/lib/http";

export const maxDuration = 120;

// Chats are private to their owner (a parent can't read Maicie's).
export const GET = handle(async () => {
  const me = await requireUser();
  if (me instanceof Response) return me;
  return ok({ display: (await getChat(me.id)).display });
});

export const POST = handle(async (req) => {
  const me = await requireUser();
  if (me instanceof Response) return me;
  const b = await body<{ text: string; date: string }>(req);
  const text = typeof b.text === "string" ? b.text.trim().slice(0, 2000) : "";
  if (!text) return bad("Say something first");
  const date = isDate(b.date) ? b.date : new Date().toISOString().slice(0, 10);
  return ok({ display: (await chatTurn(me, text, date)).display });
});
