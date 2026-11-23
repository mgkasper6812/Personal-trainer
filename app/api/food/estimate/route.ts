import { requireUser } from "@/lib/auth";
import { estimateFood } from "@/lib/coach";
import { bad, body, handle, ok } from "@/lib/http";

export const maxDuration = 60;

// Words and/or a photo (plate or nutrition label) → itemized nutrition. Nothing is logged until confirmed.
export const POST = handle(async (req) => {
  const me = await requireUser();
  if (me instanceof Response) return me;
  const b = await body<{ text: string; image: string }>(req);
  const text = typeof b.text === "string" ? b.text.trim().slice(0, 500) : "";
  let image: { mediaType: "image/jpeg" | "image/png" | "image/webp"; data: string } | undefined;
  if (typeof b.image === "string" && b.image) {
    const m = b.image.match(/^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/=]+)$/);
    if (!m || m[2].length > 5_000_000) return bad("Attach a JPG or PNG photo");
    image = { mediaType: m[1] as "image/jpeg", data: m[2] };
  }
  if (!text && !image) return bad("Describe the food or add a photo");
  return ok(await estimateFood({ text, image }));
});
