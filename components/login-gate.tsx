import { GoogleSignIn } from "@/components/google-sign-in";
import { LandingPage } from "@/components/landing-page";
import { LineAddCard } from "@/components/line-add-card";
import { LoginRequired } from "@/components/login-required";
import { NEEDS_GOOGLE_MESSAGE } from "@/lib/identity";
import type { Identity } from "@/lib/current-user";

export function LoginGate({
  state,
  linking = false,
  withLineCard = false,
  landing = false,
}: {
  state: Exclude<Identity["state"], "ok">;
  linking?: boolean;
  withLineCard?: boolean;
  /** トップ（/）だけ true。ほかのページは「ログインすると見られます」を出す */
  landing?: boolean;
}) {
  if (!linking && state === "anonymous") {
    return landing ? <LandingPage /> : <LoginRequired />;
  }
  return (
    <div className="space-y-6">
      {state === "no-data" && (
        <p className="rounded-xl border border-red-300 bg-red-50 p-4 text-sm font-bold leading-relaxed text-red-700">
          {NEEDS_GOOGLE_MESSAGE}
        </p>
      )}
      <GoogleSignIn linking={linking} />
      {withLineCard && <LineAddCard />}
    </div>
  );
}
