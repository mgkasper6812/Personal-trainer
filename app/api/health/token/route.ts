import { requireUser } from "@/lib/auth";
import { getHealthToken, newHealthToken } from "@/lib/data";
import { handle, ok } from "@/lib/http";

export const GET = handle(async () => {
  const me = await requireUser();
  if (me instanceof Response) return me;
  return ok({ token: (await getHealthToken(me.id)) ?? (await newHealthToken(me.id)) });
});

export const POST = handle(async () => {
  const me = await requireUser();
  if (me instanceof Response) return me;
  return ok({ token: await newHealthToken(me.id) });
});
