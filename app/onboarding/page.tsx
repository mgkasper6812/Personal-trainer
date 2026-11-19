import Onboarding from "@/components/Onboarding";
import { pageUser } from "@/lib/page";

export const dynamic = "force-dynamic";

export default async function Page({ searchParams }: { searchParams: Promise<{ user?: string }> }) {
  const me = await pageUser();
  const { user } = await searchParams;
  return <Onboarding viewUser={user && user !== me.id ? user : null} />;
}
