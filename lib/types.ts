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
