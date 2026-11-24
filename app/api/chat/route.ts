import { requireUser } from "@/lib/auth";
import { chatTurn, getChat, markSeen, unreadCount } from "@/lib/chat";
import { isDate } from "@/lib/dates";
import { bad, body, handle, ok } from "@/lib/http";

export const maxDuration = 120;

// Chats are private to their owner (a parent can't read Maicie's).
// ?unread=1 → just the count of new coach messages (for the tab badge); otherwise the conversation, marked as read.
export const GET = handle(async (req) => {
  const me = await requireUser();
  if (me instanceof Response) return me;
  const q = new URL(req.url).searchParams;
  if (q.get("unread")) return ok({ unread: unreadCount(await getChat(me.id)) });
  if (q.get("latest")) {
    const st = await getChat(me.id);
    return ok({ latest: [...st.display].reverse().find((l) => l.role === "coach") ?? null, unread: unreadCount(st) });
  }
  return ok({ display: (await markSeen(me.id)).display });
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
