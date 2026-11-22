// Built-in exercise library. The AI coach must build routines from these ids.

export type ExerciseKind =
  | "weight_reps" // load × reps
  | "reps" // bodyweight reps (optional added load)
  | "duration" // seconds
  | "cardio" // minutes (+ optional distance)
  | "swings" // swing count (+ top bat speed / exit velo)
  | "sprint" // seconds per rep
  | "throws" // throw count (+ distance or velo)
  | "jump"; // distance or height in inches

export type Region = "shoulder" | "elbow" | "wrist" | "back" | "hip" | "knee" | "ankle" | "neck";

export type Exercise = {
  id: string;
  name: string;
  kind: ExerciseKind;
  muscles: string[];
  equipment: string[];
  regions: Region[]; // body areas this loads (used by pain rules)
  tags: string[]; // throwing, overhead, hitting, speed, plyo, lower, upper, core, mobility, test
  cue: string;
};

const E = (
  id: string, name: string, kind: ExerciseKind, muscles: string[], equipment: string[],
  regions: Region[], tags: string[], cue: string,
): Exercise => ({ id, name, kind, muscles, equipment, regions, tags, cue });

export const EXERCISES: Exercise[] = [
  // ---- Lower body
  E("goblet_squat", "Goblet Squat", "weight_reps", ["quads", "glutes"], ["dumbbell", "kettlebell"], ["knee", "hip", "back"], ["lower"], "Elbows inside knees, chest tall, sit between your heels."),
  E("db_split_squat", "Dumbbell Split Squat", "weight_reps", ["quads", "glutes"], ["dumbbell"], ["knee", "hip"], ["lower"], "Back knee drops straight down; front heel stays planted."),
  E("rfe_split_squat", "Rear-Foot-Elevated Split Squat", "weight_reps", ["quads", "glutes"], ["dumbbell", "bench"], ["knee", "hip"], ["lower"], "Most weight on the front leg; slight forward lean."),
  E("db_rdl", "Dumbbell Romanian Deadlift", "weight_reps", ["hamstrings", "glutes"], ["dumbbell"], ["back", "hip"], ["lower"], "Push hips back, soft knees, bells close to legs."),
  E("sl_rdl", "Single-Leg RDL", "weight_reps", ["hamstrings", "glutes"], ["dumbbell", "kettlebell"], ["back", "hip", "ankle"], ["lower"], "Hips square to the floor; reach the back heel long."),
  E("trap_bar_deadlift", "Trap-Bar Deadlift", "weight_reps", ["glutes", "hamstrings", "quads"], ["trap bar"], ["back", "hip", "knee"], ["lower"], "Push the floor away; lock out with glutes, not low back."),
  E("back_squat", "Back Squat", "weight_reps", ["quads", "glutes"], ["barbell", "rack"], ["knee", "hip", "back"], ["lower"], "Brace, sit down between hips, drive up through midfoot."),
  E("front_squat", "Front Squat", "weight_reps", ["quads", "glutes"], ["barbell", "rack"], ["knee", "hip", "back", "wrist"], ["lower"], "Elbows high, stay tall."),
  E("hip_thrust", "Hip Thrust", "weight_reps", ["glutes"], ["dumbbell", "barbell", "bench"], ["hip", "back"], ["lower"], "Chin tucked, ribs down, squeeze at the top for 1 second."),
  E("glute_bridge", "Glute Bridge", "reps", ["glutes"], ["bodyweight"], ["hip"], ["lower"], "Drive through heels; don't arch your low back."),
  E("reverse_lunge", "Reverse Lunge", "weight_reps", ["quads", "glutes"], ["dumbbell", "bodyweight"], ["knee", "hip"], ["lower"], "Step back softly; front knee tracks over toes."),
  E("lateral_lunge", "Lateral Lunge", "weight_reps", ["adductors", "glutes"], ["dumbbell", "bodyweight"], ["knee", "hip"], ["lower"], "Sit into the hip, other leg straight."),
  E("step_up", "Dumbbell Step-Up", "weight_reps", ["quads", "glutes"], ["dumbbell", "bench"], ["knee", "hip"], ["lower"], "Whole foot on the box; don't push off the back leg."),
  E("calf_raise", "Calf Raise", "reps", ["calves"], ["bodyweight", "dumbbell"], ["ankle"], ["lower"], "Pause at the top and bottom."),
  E("copenhagen_plank", "Copenhagen Plank", "duration", ["adductors", "core"], ["bench"], ["hip", "knee"], ["lower", "core"], "Top leg on the bench, hips stacked."),
  E("kb_swing", "Kettlebell Swing", "weight_reps", ["glutes", "hamstrings"], ["kettlebell"], ["back", "hip"], ["lower", "plyo"], "Hinge, snap the hips; arms are just ropes."),
  // ---- Upper body
  E("pushup", "Push-Up", "reps", ["chest", "triceps"], ["bodyweight"], ["shoulder", "wrist", "elbow"], ["upper"], "Body in one line; elbows about 45°."),
  E("incline_pushup", "Incline Push-Up", "reps", ["chest", "triceps"], ["bench"], ["shoulder", "wrist"], ["upper"], "Hands on a bench or counter; same plank line."),
  E("db_bench", "Dumbbell Bench Press", "weight_reps", ["chest", "triceps"], ["dumbbell", "bench"], ["shoulder", "elbow"], ["upper"], "Shoulder blades pinned; bells over elbows."),
  E("db_floor_press", "Dumbbell Floor Press", "weight_reps", ["chest", "triceps"], ["dumbbell"], ["shoulder", "elbow"], ["upper"], "Pause elbows on the floor; press up."),
  E("one_arm_db_row", "One-Arm Dumbbell Row", "weight_reps", ["lats", "upper back"], ["dumbbell", "bench"], ["shoulder", "back", "elbow"], ["upper"], "Pull the elbow to your hip; no twisting."),
  E("chest_supported_row", "Chest-Supported Row", "weight_reps", ["upper back", "lats"], ["dumbbell", "bench"], ["shoulder", "elbow"], ["upper"], "Squeeze shoulder blades together at the top."),
  E("inverted_row", "Inverted Row", "reps", ["upper back", "lats"], ["bar", "trx"], ["shoulder", "elbow"], ["upper"], "Body straight; pull chest to the bar."),
  E("chin_up", "Chin-Up", "reps", ["lats", "biceps"], ["pull-up bar"], ["shoulder", "elbow"], ["upper", "overhead"], "Full hang to chin over bar; no kipping."),
  E("band_lat_pulldown", "Band Lat Pulldown", "reps", ["lats"], ["band"], ["shoulder", "elbow"], ["upper"], "Pull elbows down to your ribs."),
  E("landmine_press", "Half-Kneeling Landmine Press", "weight_reps", ["shoulders", "chest"], ["landmine", "barbell"], ["shoulder", "elbow"], ["upper"], "Ribs down; press up and slightly forward."),
  E("db_ohp", "Dumbbell Overhead Press", "weight_reps", ["shoulders", "triceps"], ["dumbbell"], ["shoulder", "elbow", "back"], ["upper", "overhead"], "Squeeze glutes; finish with biceps by ears."),
  E("band_pull_apart", "Band Pull-Apart", "reps", ["rear delts", "upper back"], ["band"], ["shoulder"], ["upper", "mobility"], "Arms straight; squeeze shoulder blades."),
  E("face_pull", "Face Pull", "reps", ["rear delts", "rotator cuff"], ["band", "cable"], ["shoulder"], ["upper"], "Pull to your eyes, thumbs back."),
  E("db_curl", "Dumbbell Curl", "weight_reps", ["biceps"], ["dumbbell"], ["elbow"], ["upper"], "Elbows pinned; control the lowering."),
  E("farmer_carry", "Farmer Carry", "duration", ["grip", "core", "traps"], ["dumbbell", "kettlebell"], ["back", "wrist"], ["core"], "Tall posture, short quick steps."),
  // ---- Core
  E("plank", "Plank", "duration", ["core"], ["bodyweight"], ["back", "shoulder"], ["core"], "Squeeze glutes, ribs down."),
  E("side_plank", "Side Plank", "duration", ["obliques"], ["bodyweight"], ["shoulder"], ["core"], "Hips high, body in a line."),
  E("dead_bug", "Dead Bug", "reps", ["core"], ["bodyweight"], [], ["core"], "Low back pressed to the floor the whole time."),
  E("pallof_press", "Pallof Press", "reps", ["core", "obliques"], ["band", "cable"], [], ["core"], "Resist the twist; press straight out."),
  E("bird_dog", "Bird Dog", "reps", ["core", "glutes"], ["bodyweight"], [], ["core"], "Reach long, don't let hips rotate."),
  // ---- Power / plyo
  E("box_jump", "Box Jump", "reps", ["quads", "glutes", "calves"], ["plyo box"], ["knee", "ankle"], ["plyo", "lower"], "Land soft and quiet; step down."),
  E("broad_jump", "Broad Jump", "jump", ["glutes", "quads"], ["bodyweight"], ["knee", "ankle", "hip"], ["plyo", "lower"], "Swing arms, jump out, stick the landing."),
  E("lateral_bound", "Lateral Bound", "reps", ["glutes", "adductors"], ["bodyweight"], ["knee", "ankle", "hip"], ["plyo", "lower", "speed"], "Push sideways off the outside leg; stick 2 seconds."),
  E("mb_rotational_throw", "Med Ball Rotational Throw", "reps", ["obliques", "hips"], ["med ball", "wall"], ["back", "shoulder"], ["plyo", "hitting", "core"], "Load the back hip, rotate hard, let the ball fly."),
  E("mb_scoop_toss", "Med Ball Scoop Toss", "reps", ["glutes", "hips"], ["med ball"], ["back", "hip"], ["plyo", "lower"], "Hinge and throw up and back with your hips."),
  E("mb_shotput", "Med Ball Shot Put", "reps", ["obliques", "chest"], ["med ball", "wall"], ["shoulder", "back"], ["plyo", "core"], "Step and rotate; push from your hips."),
  E("mb_slam", "Med Ball Slam", "reps", ["core", "lats"], ["med ball"], ["shoulder", "back"], ["plyo", "overhead"], "Reach tall, slam through the floor."),
  // ---- Hitting (softball)
  E("dry_swings", "Max-Intent Dry Swings", "swings", ["rotational power"], ["bat"], ["back", "wrist", "elbow"], ["hitting"], "Every swing at full intent; rest 20–30 s between."),
  E("tee_work", "Tee Work", "swings", ["hitting"], ["bat", "tee", "net"], ["back", "wrist", "elbow"], ["hitting"], "One focus cue per round (from your hitting coach)."),
  E("front_toss", "Front Toss", "swings", ["hitting"], ["bat", "net"], ["back", "wrist", "elbow"], ["hitting"], "Barrel the ball; middle of the field first."),
  E("machine_bp", "Machine / Cage BP", "swings", ["hitting"], ["bat", "pitching machine"], ["back", "wrist", "elbow"], ["hitting"], "Game-speed timing; track hard-hit balls."),
  E("overload_swings", "Overload Bat Swings (+20%)", "swings", ["rotational power"], ["weighted bat"], ["back", "wrist", "elbow"], ["hitting"], "Max intent; stop if bat speed drops."),
  E("underload_swings", "Underload Bat Swings (−20%)", "swings", ["bat speed"], ["light bat"], ["back", "wrist", "elbow"], ["hitting"], "Fastest swings of the day."),
  E("bunt_slap", "Bunting & Slapping", "swings", ["short game"], ["bat"], ["wrist"], ["hitting"], "Soft hands; run through the bag."),
  // ---- Speed / agility
  E("sprint_10", "10-Yard Sprint", "sprint", ["acceleration"], ["open space"], ["hip", "knee", "ankle"], ["speed"], "Low push, big arm drive; full rest."),
  E("sprint_20_fly", "Flying 20s", "sprint", ["top speed"], ["open space"], ["hip", "knee", "ankle"], ["speed"], "20 yd build-up, then 20 yd max."),
  E("home_to_first", "Home to First", "sprint", ["acceleration"], ["field"], ["hip", "knee", "ankle"], ["speed", "test"], "From the box; note if from a swing or standing."),
  E("sprint_60", "60-Yard Dash", "sprint", ["speed"], ["open space"], ["hip", "knee", "ankle"], ["speed", "test"], "Full warm-up first."),
  E("pro_agility", "Pro Agility 5-10-5", "sprint", ["agility"], ["open space", "cones"], ["knee", "ankle", "hip"], ["speed", "test"], "Low hips at each turn; touch the line."),
  E("drop_step_routes", "Drop-Step Fly-Ball Routes", "reps", ["first step"], ["field", "balls"], ["hip", "knee", "ankle"], ["speed"], "Open the hips, crossover, eyes on the ball."),
  E("tempo_runs", "Tempo Runs (100 yd @ 70%)", "sprint", ["conditioning"], ["field"], ["hip", "knee", "ankle"], ["speed"], "Relaxed; walk back recovery."),
  // ---- Throwing / arm care
  E("band_arm_care", "Band Arm Care (ER/IR, Y, T)", "reps", ["rotator cuff"], ["band"], ["shoulder"], ["mobility"], "Slow and controlled; no pain."),
  E("long_toss", "Long Toss", "throws", ["arm"], ["ball", "partner"], ["shoulder", "elbow"], ["throwing"], "Arc out, then pull down; stop if the arm feels off."),
  E("crow_hop_throws", "Crow-Hop Throws to Target", "throws", ["arm"], ["ball", "partner"], ["shoulder", "elbow"], ["throwing"], "Crow hop, throw on a line through the target."),
  E("of_velo_test", "Outfield Throw Velocity", "throws", ["arm"], ["ball", "radar"], ["shoulder", "elbow"], ["throwing", "test"], "Best of 3 with a crow hop."),
  // ---- Cardio / recovery
  E("brisk_walk", "Brisk Walk", "cardio", ["cardio"], ["none"], ["knee", "ankle"], ["cardio"], "Able to talk, not sing."),
  E("post_meal_walk", "Post-Meal Walk", "cardio", ["cardio"], ["none"], [], ["cardio"], "10–15 min right after eating — blunts the blood-sugar spike."),
  E("zone2_cardio", "Zone 2 Cardio", "cardio", ["cardio"], ["bike", "treadmill", "none"], ["knee"], ["cardio"], "Easy, steady pace you could hold a conversation at — about 60–70% of max heart rate (roughly 180 minus your age as the ceiling). Watch: Heart Rate Zones, stay in Zone 2."),
  E("bike_intervals", "Bike Intervals", "cardio", ["cardio"], ["bike"], ["knee"], ["cardio"], "30 s hard / 90 s easy."),
  E("easy_bike", "Easy Bike / Jog", "cardio", ["cardio"], ["bike"], ["knee"], ["cardio", "mobility"], "Conversational pace."),
  E("mobility_flow", "Mobility Flow", "duration", ["mobility"], ["bodyweight"], [], ["mobility"], "Hips, T-spine, ankles — slow breathing."),
  E("dynamic_warmup", "Dynamic Warm-Up", "duration", ["warm-up"], ["bodyweight"], [], ["mobility"], "Skips, lunges with reach, leg swings, A-skips."),
];

export const EXERCISE_BY_ID = new Map(EXERCISES.map((e) => [e.id, e]));
export const getExercise = (id: string) => EXERCISE_BY_ID.get(id);

/** Compact list for the AI prompt. */
export function libraryForPrompt(role: "parent" | "athlete") {
  return EXERCISES.filter((e) => role === "athlete" || !e.tags.some((t) => ["hitting", "throwing"].includes(t)) || e.id === "post_meal_walk")
    .map((e) => `${e.id} | ${e.name} | ${e.kind} | ${e.equipment.join("/")}`)
    .join("\n");
}
