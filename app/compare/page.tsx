import { CompareScreen } from "@/components/compare-screen";
import { LoginGate } from "@/components/login-gate";
import { identity } from "@/lib/current-user";

export const dynamic = "force-dynamic";

export default async function ComparePage() {
  const id = await identity();
  if (id.state !== "ok") return <LoginGate state={id.state} />;
  return <CompareScreen />;
}
