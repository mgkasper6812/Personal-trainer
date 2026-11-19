import { createUser, familyExists, startSession } from "@/lib/auth";
import { bad, body, handle, ok } from "@/lib/http";

export const POST = handle(async (req) => {
  if (await familyExists()) return bad("This family is already set up. Sign in instead.", 409);
  const b = await body<{ name: string; username: string; password: string }>(req);
  const user = await createUser({ name: b.name ?? "", username: b.username ?? "", password: b.password ?? "", role: "parent" });
  await startSession(user.id);
  return ok({ ok: true });
});
