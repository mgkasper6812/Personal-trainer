import RoutineEditor from "@/components/RoutineEditor";
import { pageUser } from "@/lib/page";

export const dynamic = "force-dynamic";

export default async function Page({ params }: { params: Promise<{ key: string }> }) {
  await pageUser({ needsProgram: true });
  return <RoutineEditor routineKey={(await params).key} />;
}
