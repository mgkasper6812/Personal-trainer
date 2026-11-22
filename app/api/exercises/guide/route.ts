import { requireUser } from "@/lib/auth";
import { writeExerciseGuide } from "@/lib/coach";
import { getGuide, saveGuide } from "@/lib/data";
import { getExercise } from "@/lib/exercises";
import { bad, handle, ok } from "@/lib/http";

export const maxDuration = 60;

// Technique guide for one exercise: written by the coach the first time it's opened, then cached for everyone.
export const GET = handle(async (req) => {
  const me = await requireUser();
  if (me instanceof Response) return me;
  const id = new URL(req.url).searchParams.get("id") ?? "";
  const e = getExercise(id);
  if (!e) return bad("Unknown exercise", 404);
  let guide = await getGuide(id);
  if (!guide) {
    guide = await writeExerciseGuide(e);
    await saveGuide(id, guide);
  }
  return ok({ guide });
});
