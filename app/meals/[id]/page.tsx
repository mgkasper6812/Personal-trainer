import RecipeView from "@/components/RecipeView";
import TabBar from "@/components/TabBar";
import { pageUser } from "@/lib/page";

export const dynamic = "force-dynamic";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const me = await pageUser();
  return (<><RecipeView id={(await params).id} canPlan={me.role === "parent"} /><TabBar role={me.role} /></>);
}
