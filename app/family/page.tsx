import { redirect } from "next/navigation";
import Family from "@/components/Family";
import TabBar from "@/components/TabBar";
import { pageUser } from "@/lib/page";

export const dynamic = "force-dynamic";

export default async function Page() {
  const me = await pageUser();
  if (me.role !== "parent") redirect("/today");
  return (
    <>
      <Family />
      <TabBar role={me.role} />
    </>
  );
}
