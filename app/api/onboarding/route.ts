import { requireUser, resolveTarget } from "@/lib/auth";
import { extractProfile, generateProgram, onboardingTurn } from "@/lib/coach";
import { getOnboarding, getProfile, getProgram, saveOnboarding, saveProfile, saveProgram } from "@/lib/data";
import { isDate, mondayOf } from "@/lib/dates";
import { bad, body, handle, ok } from "@/lib/http";
import type { OnboardingState } from "@/lib/coach";

// Older chats could be marked finished while the coach's last message still asked a question; reopen those.
function normalize(state: OnboardingState | null): OnboardingState | null {
  if (!state?.complete) return state;
  const last = [...state.display].reverse().find((l) => l.role === "coach");
  return last?.text.includes("?") ? { ...state, complete: false } : state;
}

export const maxDuration = 300;

// GET: the transcript (parents can read a member's). POST: the signed-in user's next turn.
export const GET = handle(async (req) => {
  const me = await requireUser();
  if (me instanceof Response) return me;
  const target = await resolveTarget(me, new URL(req.url).searchParams.get("user"));
  if (!target) return bad("Not allowed", 403);
  const [raw, program] = await Promise.all([getOnboarding(target.id), getProgram(target.id)]);
  const state = program ? raw : normalize(raw);
  return ok({ name: target.name, display: state?.display ?? [], complete: !!state?.complete, hasProgram: !!program, self: target.id === me.id });
});

export const POST = handle(async (req) => {
  const me = await requireUser();
  if (me instanceof Response) return me;
  const b = await body<{ text: string; date: string; action: "start" | "reply" | "build" }>(req);
  const role = me.role;
  let state = normalize(await getOnboarding(me.id)) ?? { messages: [], display: [], complete: false };
  if (await getProgram(me.id)) return ok({ display: state.display, complete: true, built: true });

  if (b.action === "start") {
    if (!state.display.length) {
      state = await onboardingTurn(role, me.name, state, null);
      await saveOnboarding(me.id, state);
    }
    return ok({ display: state.display, complete: state.complete, built: false });
  }

  if (b.action === "reply") {
    const text = (b.text ?? "").trim();
    if (!text) return bad("Say something first.");
    if (!state.messages.length) state = await onboardingTurn(role, me.name, state, null);
    // Answers that arrive after the coach wrapped up are still added — the coach folds them in.
    state = await onboardingTurn(role, me.name, state, text.slice(0, 4000));
    await saveOnboarding(me.id, state);
    return ok({ display: state.display, complete: state.complete, built: false });
  }

  // Build in two short steps so each request stays well under the server time limit.
  if (!state.complete) return bad("The coach needs a few more answers first.");
  if (!(await getProfile(me.id))) {
    await saveProfile(me.id, await extractProfile(role, state.display));
    return ok({ display: state.display, complete: true, built: false, stage: "profile" });
  }
  const profile = (await getProfile(me.id))!;
  const date = isDate(b.date) ? b.date : new Date().toISOString().slice(0, 10);
  const startDate = mondayOf(date);
  const program = await generateProgram(role, profile, startDate);
  await saveProgram(me.id, { program, startDate, createdAt: new Date().toISOString() });
  return ok({ display: state.display, complete: true, built: true });
});
