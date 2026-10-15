import { GoogleSignIn } from "@/components/google-sign-in";
import { LineConnectScreen } from "@/components/line-connect-screen";
import { clerkEnabled } from "@/lib/account";
import { currentUser } from "@/lib/current-user";

export const dynamic = "force-dynamic";

export default async function LineConnectPage({ searchParams }: { searchParams: Promise<{ code?: string }> }) {
  const { code } = await searchParams;
  if (!clerkEnabled()) {
    return <p className="py-10 text-center text-sm leading-7 text-muted">ログイン設定中です。しばらくしてから、もう一度LINEからURLを送ってください。</p>;
  }
  const user = await currentUser();
  if (!user) return <GoogleSignIn linking />;
  return <LineConnectScreen code={code || ""} />;
}
