import { listUsers } from "@/lib/auth";
import { getProfile } from "@/lib/data";
import { addRecipeBatch } from "@/lib/recipes";

export const maxDuration = 300;

// Weekly (see vercel.json): add new dinners to the family library. Vercel sends `Authorization: Bearer $CRON_SECRET`.
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) return new Response("Unauthorized", { status: 401 });
  const users = await listUsers();
  for (const u of users.filter((x) => x.role === "parent")) {
    const p = await getProfile(u.id);
    if (p?.kind !== "adult") continue;
    const added = await addRecipeBatch(u.id);
    return Response.json({ ok: true, added: added.length, for: u.name });
  }
  return Response.json({ ok: true, added: 0 });
}
