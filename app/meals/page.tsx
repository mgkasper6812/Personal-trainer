import { redirect } from "next/navigation";
import Meals from "@/components/Meals";
import TabBar from "@/components/TabBar";
import { pageUser } from "@/lib/page";

export const dynamic = "force-dynamic";

export default async function Page() {
  const me = await pageUser();
  if (me.role !== "parent") redirect("/today");
  return (<><Meals /><TabBar role={me.role} /></>);
}
