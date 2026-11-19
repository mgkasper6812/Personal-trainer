import { redirect } from "next/navigation";
import { currentUser, familyExists, publicUser } from "./auth";
import { getProgram } from "./data";

/** Server-side guard for app pages. */
export async function pageUser(opts: { needsProgram?: boolean } = {}) {
  const me = await currentUser();
  if (!me) redirect((await familyExists()) ? "/login" : "/setup");
  if (opts.needsProgram && !(await getProgram(me.id))) redirect("/onboarding");
  return publicUser(me);
}
