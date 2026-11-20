import Logger from "@/components/Logger";
import { pageUser } from "@/lib/page";

export const dynamic = "force-dynamic";

export default async function Page() {
  await pageUser();
  return <Logger />;
}
