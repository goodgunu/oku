"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { LoginOptions } from "@/components/login-options";

/** ログイン後に今のページへ戻れるよう、今のURLを渡す。Clerk未設定の環境ではLINEだけ出す。 */
export function LoginRequiredOptions({ clerk }: { clerk: boolean }) {
  const [here, setHere] = useState("/");
  useEffect(() => {
    const path = `${window.location.pathname}${window.location.search}`;
    setHere(path.startsWith("/sso-callback") ? "/" : path);
  }, []);

  if (clerk) return <LoginOptions redirectUrl={here} />;
  return (
    <a
      href={`/api/auth/line-login?next=${encodeURIComponent(here)}`}
      className="flex h-12 w-full items-center justify-center gap-3 rounded-full text-base font-bold text-white shadow-sm"
      style={{ background: "#06C755" }}
    >
      <Image src="/icon-line.png" alt="" width={22} height={21} />
      LINEで続ける
    </a>
  );
}
