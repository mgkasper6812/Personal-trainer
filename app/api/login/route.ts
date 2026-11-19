import { startSession, verifyLogin } from "@/lib/auth";
import { bad, body, handle, ok } from "@/lib/http";

export const POST = handle(async (req) => {
  const b = await body<{ username: string; password: string }>(req);
  const user = await verifyLogin(b.username ?? "", b.password ?? "");
  if (!user) return bad("Wrong username or password.", 401);
  await startSession(user.id);
  return ok({ ok: true });
});
