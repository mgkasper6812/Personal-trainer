import { createUser, requireUser } from "@/lib/auth";
import { bad, body, handle, ok } from "@/lib/http";

// Parent adds a family member (e.g. Maicie) with her own login.
export const POST = handle(async (req) => {
  const me = await requireUser();
  if (me instanceof Response) return me;
  if (me.role !== "parent") return bad("Only a parent can add family members.", 403);
  const b = await body<{ name: string; username: string; password: string; role: "athlete" | "parent" }>(req);
  const user = await createUser({
    name: b.name ?? "",
    username: b.username ?? "",
    password: b.password ?? "",
    role: b.role === "parent" ? "parent" : "athlete",
  });
  return ok({ id: user.id });
});
