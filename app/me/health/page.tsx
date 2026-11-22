import { redirect } from "next/navigation";
import HealthBioForm from "@/components/HealthBioForm";
import TabBar from "@/components/TabBar";
import { pageUser } from "@/lib/page";

export const dynamic = "force-dynamic";

export default async function Page() {
  const me = await pageUser();
  if (me.role !== "parent") redirect("/me");
  return (<><HealthBioForm /><TabBar role={me.role} /></>);
}
