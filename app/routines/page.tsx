import Routines from "@/components/Routines";
import TabBar from "@/components/TabBar";
import { pageUser } from "@/lib/page";

export const dynamic = "force-dynamic";

export default async function Page({ searchParams }: { searchParams: Promise<{ user?: string }> }) {
  const { user } = await searchParams;
  const me = await pageUser({ needsProgram: !user });
  return (<><Routines viewUser={user && user !== me.id ? user : null} /><TabBar role={me.role} /></>);
}
