import { requireUser } from "@/lib/auth";
import { estimateFood } from "@/lib/coach";
import { bad, body, handle, ok } from "@/lib/http";

export const maxDuration = 60;

// Words and/or a photo (plate or nutrition label) → itemized nutrition. Nothing is logged until confirmed.
export const POST = handle(async (req) => {
  const me = await requireUser();
  if (me instanceof Response) return me;
  const b = await body<{ text: string; image: string; images: string[] }>(req);
  const text = typeof b.text === "string" ? b.text.trim().slice(0, 500) : "";
  const raw = [...(Array.isArray(b.images) ? b.images : []), ...(typeof b.image === "string" && b.image ? [b.image] : [])];
  if (raw.length > 4) return bad("Up to 4 photos at a time");
  const images: { mediaType: "image/jpeg" | "image/png" | "image/webp"; data: string }[] = [];
  let total = 0;
  for (const r of raw) {
    const m = typeof r === "string" ? r.match(/^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/=]+)$/) : null;
    if (!m) return bad("Attach JPG or PNG photos");
    total += m[2].length;
    images.push({ mediaType: m[1] as "image/jpeg", data: m[2] });
  }
  if (total > 4_000_000) return bad("Those photos are too large together — try fewer");
  if (!text && !images.length) return bad("Describe the food or add a photo");
  return ok(await estimateFood({ text, images }));
});
