import { redirect } from "next/navigation";
import AuthForm from "@/components/AuthForm";
import { familyExists } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function Setup() {
  if (await familyExists()) redirect("/login");
  return <AuthForm mode="setup" />;
}
