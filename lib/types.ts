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

export type ChatMessage = { role: "user" | "assistant"; content: string };

export type CheckIn = {
  date: string;
  sleepHours?: number;
  energy?: number; // 1-5
  soreness?: number; // 1-5
  weightLb?: number;
  armFeel?: number; // 1-5 (athlete)
  pain: boolean;
  painWhere?: string;
  schedule?: string; // anything unusual today
  notes?: string;
};

export type Alert = {
  id: string;
  athleteId: string;
  athleteName: string;
  date: string;
  message: string;
  createdAt: string;
  seen: boolean;
};
