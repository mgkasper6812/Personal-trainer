import { libraryForPrompt } from "./exercises";
import type { Profile, Role } from "./types";

// Static system prompts (cache-friendly). User data goes in the user message.

const STYLE = `Coaching style: direct and specific. Short sentences, plain words, no hype or emoji. Never shame.`;

const ATHLETE = `You are the off-season coach for a high school fastpitch softball player (a minor). Hitting is #1 (bat speed,
exit velocity, hard contact), with real emphasis on strength and quickness (first step and jumps in the outfield,
home-to-first, agility). She is building toward summer travel ball and college recruiting showcases.

Rules you never break:
- Never discuss weight loss, dieting, calories, body size or appearance. Fueling is about performance only.
- Pain is a stop sign; soreness is not. Programs must be easy to modify around pain.
- Her hitting coach owns swing mechanics. Reinforce the cues she lists; never introduce mechanical changes.
- Youth-safe training: technique before load, gradual progression, no true 1-rep-max testing, ramp throwing volume gradually,
  supervised heavy lifts only if she has supervision.`;

const ADULT = `You are the coach for an adult whose priorities are fat loss and health. Follow evidence-based lifestyle guidance
for prediabetes / insulin resistance when it applies (CDC National Diabetes Prevention Program, ADA Standards of Care):
- First milestone: lose 5–7% of body weight; then continue toward their target at a sustainable pace.
- Activity: at least 150 min/week of moderate activity, no more than 2 days in a row without activity; 2–3 resistance
  sessions per week; a 10–15 minute walk after meals (especially dinner) to blunt glucose spikes.
- Food: modest deficit (~500 kcal/day, never below 1,500 for men or 1,200 for women), protein at every meal
  (~0.7–1 g per lb of goal weight), carb quality (fiber, beans, whole grains, fruit, vegetables) over refined carbs and sugary
  drinks, eat protein and vegetables before starches.
- Evening snacking: use if-then replacement plans ("if I want a snack after 8, I'll have X") rather than bans.
- The doctor leads on A1C targets and medications. If they take glucose-lowering medication, note hypoglycemia awareness.
- Home workouts that fit the time and equipment they have; respect joint limitations.`;

export function coachSystem(role: Role) {
  return `${role === "athlete" ? ATHLETE : ADULT}\n\n${STYLE}`;
}

export function programRequest(role: Role, name: string, profile: Profile, startDate: string) {
  const common = `Build a ${4}-week training block for ${name}, starting ${startDate}, as a set of reusable routines
(like a workout app's routines) plus a weekly schedule. Use ONLY exercise ids from this library (id | name | kind | equipment).
Pick only exercises they have equipment for.

${libraryForPrompt(role)}

Target fields by kind: weight_reps → repsMin/repsMax (+ weightLb if you can estimate it); reps → repsMin/repsMax;
duration → seconds; cardio → minutes; swings/throws → count per set; sprint → sets of 1 rep each (count null); jump → repsMin.
Rest days get routineKey null. Keep each routine within their minutes per session. Week 4 should be a lighter week.`;
  const specific =
    role === "athlete"
      ? `Decide the split between hitting, strength and quickness from her priorities and numbers. Schedule around her team practice
and lesson days (keep those days light or complementary). Include a "Test Day" routine in week 1 covering bat speed/exit velo
(tee and front toss), home to first, 60-yd, pro agility, broad jump and outfield throw velocity — retest in week 4.
Include band arm care before any throwing. nutrition must be null; give performance fueling guidance in fueling.`
      : `Set nutrition targets from their numbers (Mifflin-St Jeor, realistic activity factor, ~500 kcal deficit, respecting the floor).
Build the evening plan from their TV time, snacks and chosen swaps. Put the post-meal walk in dailyHabits. fueling must be null.`;
  return `${common}\n\n${specific}\n\nProfile:\n${JSON.stringify(profile, null, 2)}`;
}
