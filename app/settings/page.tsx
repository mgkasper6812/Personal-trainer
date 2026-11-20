import Settings from "@/components/Settings";
import TabBar from "@/components/TabBar";
import { pageUser } from "@/lib/page";

export const dynamic = "force-dynamic";

export default async function Page() {
  const me = await pageUser();
  return (<><Settings name={me.name} role={me.role} /><TabBar role={me.role} /></>);
}
