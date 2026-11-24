import { dispatch } from "@/lib/push";

export const maxDuration = 120; // morning reports are written on the first run of the day

// Hit every ~15 minutes by the GitHub Actions schedule (.github/workflows/notify.yml) with `Authorization: Bearer $CRON_SECRET`.
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) return new Response("Unauthorized", { status: 401 });
  return Response.json({ ok: true, sent: await dispatch() });
}
