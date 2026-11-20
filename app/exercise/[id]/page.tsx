import ExerciseDetail from "@/components/ExerciseDetail";
import TabBar from "@/components/TabBar";
import { pageUser } from "@/lib/page";

export const dynamic = "force-dynamic";

export default async function Page({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ user?: string }> }) {
  const me = await pageUser();
  const { user } = await searchParams;
  return (<><ExerciseDetail id={(await params).id} viewUser={user && user !== me.id ? user : null} /><TabBar role={me.role} /></>);
}
