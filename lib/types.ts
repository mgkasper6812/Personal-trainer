import type { Region } from "./exercises";

export type Role = "parent" | "athlete";

export type User = {
  id: string;
  name: string;
  username: string;
  role: Role;
  passHash: string;
  createdAt: string;
};
export type PublicUser = Omit<User, "passHash">;

// ---------------- Profiles (from tap-first onboarding) ----------------

export type AdultProfile = {
  kind: "adult";
  goals: string[];
  pace: "gentle" | "steady" | "faster";
  sex: "male" | "female";
  age: number;
  heightIn: number;
  weightLb: number;
  targetWeightLb: number | null;
  glucoseStatus: "prediabetic" | "insulin_resistant" | "both" | "neither" | "not_sure";
  a1c: number | null;
  meds: string[];
  conditions: string[]; // e.g. high blood pressure
  toughestTime: string;
  tvTime: string; // "HH:MM"
  snacks: string[];
  snackFrequency: "rarely" | "some" | "most";
  eveningSwaps: string[];
  kitchenCloses: string | null; // "HH:MM"
  trackingStyle: "plan_only" | "evenings" | "meals";
  dinners: string[];
  daysPerWeek: number;
  minutes: number;
  busyDays?: string[]; // keep these light or rest
  cardioDay?: string | null; // weekly Zone 2 cardio day
  equipment: string[];
  experience: "new" | "returning" | "regular";
  limitations: Region[];
  avoid: string;
  devices: string[];
  tone: "direct" | "encouraging";
  proactive: "off" | "important" | "daily";
  notes: string;
};

export type AthleteProfile = {
  kind: "athlete";
  position: string;
  secondary: string[];
  bats: "R" | "L" | "S";
  throws: "R" | "L";
  slapper: boolean;
  gradYear: number;
  priorities: string[]; // ranked
  events: { name: string; date: string }[];
  practiceDays: string[];
  lessonDays: string[];
  daysPerWeek: number;
  minutes: number;
  gear: string[];
  liftingBackground: "none" | "team" | "structured";
  comfortableLifts: string[];
  supervised: boolean;
  numbers: Partial<Record<"batSpeed" | "teeEV" | "frontTossEV" | "homeToFirst" | "dash60" | "sprint10" | "broadJump" | "throwVelo", number>>;
  homeToFirstMethod: "standing" | "swing" | null;
  hittingFocus: string[];
  hittingCues: string;
  pastInjuries: Region[];
  painNow: boolean;
  tone: "direct" | "hype";
  proactive: "off" | "important" | "daily";
  notes: string;
};

export type Profile = AdultProfile | AthleteProfile;

// ---------------- Daily ----------------

export type CheckIn = {
  date: string;
  sleepHours?: number;
  energy?: number; // 1-5
  soreness?: number; // 1-5
  mood?: number; // 1-5 (athlete)
  stress?: number; // 1-5 (athlete)
  pain: boolean;
  painRegion?: Region;
  painSide?: "left" | "right" | "both";
  painLevel?: number; // 0-10
  painQuality?: "sharp" | "achy";
  painWithThrowing?: boolean;
  redFlags?: string[];
  symptoms?: string[]; // adult: chest pain, dizziness...
  note?: string; // private to the user
};

export type EveningLog = "plan" | "bit" | "off";

// ---------------- Workouts ----------------

export type SetType = "warmup" | "normal" | "drop" | "failure";

export type LoggedSet = {
  type: SetType;
  weight?: number;
  reps?: number;
  seconds?: number;
  count?: number;
  topSpeed?: number; // bat speed or throw velo (mph)
  topEV?: number; // exit velo (mph)
  distance?: number; // inches (jumps) or feet (throws)
  minutes?: number;
  rpe?: number;
  done: boolean;
};

export type LoggedExercise = {
  exerciseId: string;
  notes: string;
  restSec: number;
  superset: string | null;
  sets: LoggedSet[];
};

export type PR = { exerciseId: string; label: string; value: number; unit: string };

export type Workout = {
  id: string;
  date: string; // local YYYY-MM-DD
  name: string;
  routineKey: string | null;
  startedAt: string; // ISO
  endedAt: string; // ISO
  exercises: LoggedExercise[];
  rpe?: number; // session RPE
  notes?: string;
  watch?: { avgHR?: number; maxHR?: number; calories?: number; durationMin?: number; syncedAt: string };
  stats: { volume: number; sets: number; prs: PR[] };
};

export type WorkoutSummary = Pick<Workout, "id" | "date" | "name" | "startedAt" | "endedAt"> & {
  volume: number;
  sets: number;
  prs: number;
  watch: boolean;
};

export type Alert = {
  id: string;
  athleteId: string;
  athleteName: string;
  date: string;
  level: "info" | "warn" | "urgent";
  message: string;
  createdAt: string;
  seen: boolean;
};

// ---------------- Health bio (private to its owner) ----------------

export type Medication = { name: string; dose: string; timing: string; purpose: string };
export type LabResult = { name: string; value: number; unit: string; date: string };

export type HealthBio = {
  conditions: string[]; // e.g. Prediabetes, Insulin resistance, High blood pressure
  medications: Medication[];
  supplements: string;
  allergies: string[];
  dislikes: string[]; // foods he won't eat
  dietStyle: string[]; // e.g. Lower-carb, High-fiber, Mediterranean
  alcohol: string;
  labs: LabResult[];
  doctor: string;
  notes: string;
  updatedAt: string;
};

// ---------------- Meals ----------------

export type Ingredient = { item: string; qty: number | null; unit: string; aisle: string; note: string | null };

export type Recipe = {
  id: string;
  title: string;
  description: string;
  servings: number;
  timeMin: number;
  tags: string[];
  ingredients: Ingredient[];
  steps: string[];
  nutrition: { calories: number; proteinG: number; carbsG: number; fiberG: number; fatG: number }; // per serving, estimated
  plateTip: string; // how Mike builds his plate
  familyTip: string | null; // add-ons for the rest of the family
  addedAt: string;
  batch: string; // week it arrived (YYYY-MM-DD)
  rating: 1 | -1 | null;
  favorite: boolean;
};
export type RecipeSummary = Pick<Recipe, "id" | "title" | "description" | "timeMin" | "tags" | "nutrition" | "batch" | "rating" | "favorite">;

export type MealPlan = { weekStart: string; days: Record<string, string | null>; have: string[]; extras: string[]; shareToken: string | null };
