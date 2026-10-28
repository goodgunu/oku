"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { LoginOptions } from "@/components/login-options";
import { isLineInApp } from "@/lib/in-app-browser";

export function GoogleSignIn({ linking = false }: { linking?: boolean }) {
  const [inLine, setInLine] = useState(false);
  const [redirectUrl, setRedirectUrl] = useState("/");

  useEffect(() => {
    setInLine(isLineInApp(navigator.userAgent));
    const here = `${window.location.pathname}${window.location.search}`;
    setRedirectUrl(here.startsWith("/sso-callback") ? "/" : here);
  }, []);

  return (
    <div className="mx-auto max-w-md space-y-4 rounded-2xl border border-border bg-card p-6 shadow-sm">
      <h1 className="text-xl font-bold text-ink">{linking ? "LINEとつなぐ" : "ログイン・新規登録"}</h1>
      <p className="text-sm leading-relaxed text-muted">
        {linking
          ? "最初の1回だけ、ログインしてLINEの「おく」とつなぎます。次からは、URLを送るだけで保存されます。"
          : "ログインすると、スマホでもパソコンでも同じライブラリが見えます。"}
      </p>
      {inLine && (
        <p className="rounded-lg bg-[#fff8d6] px-3 py-2 text-xs font-bold text-ink">
          LINEアプリ内では「LINEで続ける」がいちばんスムーズです。
        </p>
      )}
      <LoginOptions redirectUrl={redirectUrl} />
      <p className="pt-1 text-center text-xs leading-5 text-muted">
        続けると、<Link href="/terms" className="underline">利用規約</Link>と<Link href="/privacy" className="underline">プライバシーポリシー</Link>に同意したものとみなします。
      </p>
    </div>
  );
}
