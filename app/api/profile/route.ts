import { requireUser, resolveTarget } from "@/lib/auth";
import { getProfile, saveProfile } from "@/lib/data";
import { bad, body, handle, ok } from "@/lib/http";
import type { Profile } from "@/lib/types";

export const GET = handle(async (req) => {
  const me = await requireUser();
  if (me instanceof Response) return me;
  const target = await resolveTarget(me, new URL(req.url).searchParams.get("user"));
  if (!target) return bad("Not allowed", 403);
  return ok({ name: target.name, role: target.role, profile: await getProfile(target.id) });
});

export const POST = handle(async (req) => {
  const me = await requireUser();
  if (me instanceof Response) return me;
  const { profile } = await body<{ profile: Profile }>(req);
  if (!profile || typeof profile !== "object") return bad("Missing profile");
  const expected = me.role === "athlete" ? "athlete" : "adult";
  if (profile.kind !== expected) return bad("Wrong profile type for this account");
  if (profile.kind === "athlete") {
    // Nothing weight-related is ever stored on an athlete profile.
    delete (profile as unknown as Record<string, unknown>).weightLb;
  }
  const json = JSON.stringify(profile);
  if (json.length > 20000) return bad("Profile too large");
  await saveProfile(me.id, profile);
  return ok({ ok: true });
});
