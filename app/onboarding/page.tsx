import Setup from "@/components/Setup";
import { getProfile } from "@/lib/data";
import { pageUser } from "@/lib/page";

export const dynamic = "force-dynamic";

export default async function Page() {
  const me = await pageUser();
  return <Setup role={me.role} initial={await getProfile(me.id)} />;
}
