import { AuthenticateWithRedirectCallback } from "@clerk/nextjs";
import { redirect } from "next/navigation";
import { clerkEnabled } from "@/lib/account";

export const dynamic = "force-dynamic";

export default function SsoCallbackPage() {
  if (!clerkEnabled()) redirect("/");
  return <AuthenticateWithRedirectCallback />;
}
