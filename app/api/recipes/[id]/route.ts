import { requireUser } from "@/lib/auth";
import { getRecipe } from "@/lib/data";
import { bad, body, ok } from "@/lib/http";
import { setRecipeFeedback } from "@/lib/recipes";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: Ctx) {
  const me = await requireUser();
  if (me instanceof Response) return me;
  const r = await getRecipe((await params).id);
  return r ? ok({ recipe: r }) : bad("Not found", 404);
}

export async function PATCH(req: Request, { params }: Ctx) {
  const me = await requireUser();
  if (me instanceof Response) return me;
  const b = await body<{ rating: 1 | -1 | null; favorite: boolean }>(req);
  const patch: { rating?: 1 | -1 | null; favorite?: boolean } = {};
  if (b.rating === 1 || b.rating === -1 || b.rating === null) patch.rating = b.rating;
  if (typeof b.favorite === "boolean") patch.favorite = b.favorite;
  const r = await setRecipeFeedback((await params).id, patch);
  return r ? ok({ recipe: r }) : bad("Not found", 404);
}
