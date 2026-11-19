import { SignJWT, jwtVerify } from "jose";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { db } from "./db";
import type { PublicUser, Role, User } from "./types";

const COOKIE = "ft_session";
const MAX_AGE = 60 * 60 * 24 * 90; // 90 days — this lives on family phones

function secret() {
  const s = process.env.SESSION_SECRET;
  if (!s) {
    if (process.env.NODE_ENV === "production") throw new Error("SESSION_SECRET is not set.");
    return new TextEncoder().encode("dev-only-secret-do-not-use-in-production");
  }
  return new TextEncoder().encode(s);
}

export const publicUser = ({ passHash: _p, ...u }: User): PublicUser => u;

export async function getUser(id: string) {
  return db().get<User>(`user:${id}`);
}

export async function listUsers(): Promise<User[]> {
  const ids = (await db().get<string[]>("family:members")) ?? [];
  const users = await Promise.all(ids.map(getUser));
  return users.filter((u): u is User => !!u);
}

export async function familyExists() {
  return ((await db().get<string[]>("family:members")) ?? []).length > 0;
}

export async function createUser(input: { name: string; username: string; password: string; role: Role }) {
  const username = input.username.trim().toLowerCase();
  if (!/^[a-z0-9_.-]{2,32}$/.test(username)) throw new Error("Username: 2–32 letters, numbers, . _ -");
  if (input.password.length < 6) throw new Error("Password must be at least 6 characters.");
  if (await db().get(`username:${username}`)) throw new Error("That username is taken.");
  const user: User = {
    id: crypto.randomUUID(),
    name: input.name.trim() || username,
    username,
    role: input.role,
    passHash: await bcrypt.hash(input.password, 10),
    createdAt: new Date().toISOString(),
  };
  await db().set(`user:${user.id}`, user);
  await db().set(`username:${username}`, user.id);
  const members = (await db().get<string[]>("family:members")) ?? [];
  await db().set("family:members", [...members, user.id]);
  return user;
}

export async function verifyLogin(username: string, password: string) {
  const id = await db().get<string>(`username:${username.trim().toLowerCase()}`);
  const user = id ? await getUser(id) : null;
  if (!user || !(await bcrypt.compare(password, user.passHash))) return null;
  return user;
}

export async function startSession(userId: string) {
  const token = await new SignJWT({ sub: userId })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${MAX_AGE}s`)
    .sign(secret());
  (await cookies()).set(COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE,
  });
}

export async function endSession() {
  (await cookies()).delete(COOKIE);
}

export async function currentUser(): Promise<User | null> {
  const token = (await cookies()).get(COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret());
    return payload.sub ? await getUser(payload.sub) : null;
  } catch {
    return null;
  }
}

/** For API routes: returns the user or a 401 Response. */
export async function requireUser(): Promise<User | Response> {
  const u = await currentUser();
  return u ?? Response.json({ error: "Not signed in" }, { status: 401 });
}

/** Parent can act on any family member; others only on themselves. */
export async function resolveTarget(me: User, targetId: string | null): Promise<User | null> {
  if (!targetId || targetId === me.id) return me;
  if (me.role !== "parent") return null;
  return getUser(targetId);
}
