import { redirect } from "next/navigation";
import { pageUser } from "@/lib/page";

export default async function Home() {
  await pageUser({ needsProgram: true });
  redirect("/today");
}
