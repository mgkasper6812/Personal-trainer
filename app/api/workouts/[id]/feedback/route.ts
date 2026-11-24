import { requireUser } from "@/lib/auth";
import { bad, ok } from "@/lib/http";
import { workoutFeedback } from "@/lib/nudges";
import { CoachError } from "@/lib/coach";

export const maxDuration = 60;

// The coach's take on a finished workout (written once, also posted to the chat).
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const me = await requireUser();
  if (me instanceof Response) return me;
  try {
    const note = await workoutFeedback(me, (await params).id);
    return note ? ok({ note }) : bad("Not found", 404);
  } catch (e) {
    return bad(e instanceof CoachError ? e.message : "Coach unavailable", 502);
  }
}
