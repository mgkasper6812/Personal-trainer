import WorkoutDetail from "@/components/WorkoutDetail";
import TabBar from "@/components/TabBar";
import { pageUser } from "@/lib/page";

export const dynamic = "force-dynamic";

export default async function Page({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ user?: string; done?: string }> }) {
  const me = await pageUser();
  const { user, done } = await searchParams;
  return (<><WorkoutDetail id={(await params).id} viewUser={user && user !== me.id ? user : null} justFinished={done === "1"} /><TabBar role={me.role} /></>);
}
