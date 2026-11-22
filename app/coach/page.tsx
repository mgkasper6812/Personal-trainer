import CoachChat from "@/components/CoachChat";
import TabBar from "@/components/TabBar";
import { pageUser } from "@/lib/page";

export const dynamic = "force-dynamic";

export default async function Page() {
  const me = await pageUser({ needsProgram: true });
  return (<><CoachChat role={me.role} /><TabBar role={me.role} /></>);
}
