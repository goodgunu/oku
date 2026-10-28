import { LineConnectScreen } from "@/components/line-connect-screen";
import { LoginGate } from "@/components/login-gate";
import { authEnabled } from "@/lib/account";
import { identity } from "@/lib/current-user";

export const dynamic = "force-dynamic";

export default async function LineConnectPage({ searchParams }: { searchParams: Promise<{ code?: string }> }) {
  const { code } = await searchParams;
  if (!authEnabled()) {
    return (
      <p className="py-10 text-center text-sm leading-7 text-muted">
        ログイン設定中です。しばらくしてから、もう一度LINEからURLを送ってください。
      </p>
    );
  }
  const id = await identity();
  if (id.state !== "ok") return <LoginGate state={id.state} linking />;
  return <LineConnectScreen code={code || ""} />;
}
