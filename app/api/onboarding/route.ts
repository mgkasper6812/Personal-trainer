import { requireUser, resolveTarget } from "@/lib/auth";
import { extractProfile, generateProgram, onboardingTurn } from "@/lib/coach";
import { getOnboarding, getProgram, saveOnboarding, saveProfile, saveProgram } from "@/lib/data";
import { isDate, mondayOf } from "@/lib/dates";
import { bad, body, handle, ok } from "@/lib/http";

export const maxDuration = 300;

// GET: the transcript (parents can read a member's). POST: the signed-in user's next turn.
export const GET = handle(async (req) => {
  const me = await requireUser();
  if (me instanceof Response) return me;
  const target = await resolveTarget(me, new URL(req.url).searchParams.get("user"));
  if (!target) return bad("Not allowed", 403);
  const [state, program] = await Promise.all([getOnboarding(target.id), getProgram(target.id)]);
  return ok({ name: target.name, display: state?.display ?? [], complete: !!state?.complete, hasProgram: !!program, self: target.id === me.id });
});

export const POST = handle(async (req) => {
  const me = await requireUser();
  if (me instanceof Response) return me;
  const b = await body<{ text: string; date: string; action: "start" | "reply" | "build" }>(req);
  const coachRole = me.role;
  let state = (await getOnboarding(me.id)) ?? { messages: [], display: [], complete: false };

  if (b.action === "start") {
    if (state.display.length) return ok({ display: state.display, complete: state.complete });
    state = await onboardingTurn(coachRole, me.name, state, null);
  } else if (b.action === "reply") {
    const text = (b.text ?? "").trim();
    if (!text) return bad("Say something first.");
    if (state.complete) return bad("Setup is already finished.");
    if (!state.messages.length) state = await onboardingTurn(coachRole, me.name, state, null);
    state = await onboardingTurn(coachRole, me.name, state, text.slice(0, 4000));
  }
  await saveOnboarding(me.id, state);

  // Once the coach has enough, build the profile and program.
  if (state.complete && !(await getProgram(me.id))) {
    const date = isDate(b.date) ? b.date : new Date().toISOString().slice(0, 10);
    const profile = await extractProfile(coachRole, state.display);
    await saveProfile(me.id, profile);
    const startDate = mondayOf(date);
    const program = await generateProgram(coachRole, profile, startDate);
    await saveProgram(me.id, { program, startDate, createdAt: new Date().toISOString() });
    return ok({ display: state.display, complete: true, built: true });
  }
  return ok({ display: state.display, complete: state.complete, built: !!(await getProgram(me.id)) });
});
