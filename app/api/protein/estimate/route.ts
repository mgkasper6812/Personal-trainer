import { requireUser } from "@/lib/auth";
import { estimateProtein } from "@/lib/coach";
import { bad, body, handle, ok } from "@/lib/http";

export const maxDuration = 60;

// Plain words → itemized protein estimates. Nothing is logged until the user confirms.
export const POST = handle(async (req) => {
  const me = await requireUser();
  if (me instanceof Response) return me;
  const { text } = await body<{ text: string }>(req);
  const t = typeof text === "string" ? text.trim() : "";
  if (!t) return bad("Say what you ate");
  if (t.length > 500) return bad("Keep it under 500 characters");
  return ok({ items: await estimateProtein(t) });
});
