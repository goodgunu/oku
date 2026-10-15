"use client";

import { useSignIn } from "@clerk/nextjs";
import { useState } from "react";

export function GoogleSignIn({ linking = false }: { linking?: boolean }) {
  const { signIn, fetchStatus } = useSignIn();
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const ready = fetchStatus !== "fetching";

  async function start() {
    if (!ready || busy) return;
    setBusy(true);
    setNotice("");
    try {
      const here = `${window.location.pathname}${window.location.search}`;
      const result = await signIn.sso({
        strategy: "oauth_google",
        redirectUrl: here.startsWith("/sso-callback") ? "/" : here,
        redirectCallbackUrl: "/sso-callback",
        oidcPrompt: "select_account",
      });
      if (result.error) {
        setBusy(false);
        setNotice(result.error.message || "Googleのログインを開始できませんでした。");
      }
    } catch (error) {
      setBusy(false);
      setNotice(error instanceof Error ? error.message : "Googleのログインを開始できませんでした。");
    }
  }

  return (
    <div className="mx-auto max-w-md space-y-4 rounded-xl border border-border bg-card p-6 shadow-sm">
      <h1 className="text-xl font-bold text-ink">{linking ? "LINEとつなぐ" : "Googleでログイン"}</h1>
      <p className="text-sm leading-relaxed text-muted">
        {linking
          ? "最初の1回だけ、このGoogleアカウントとLINEの「おく」をつなぎます。次からは、URLを送るだけで保存されます。"
          : "いつも使っているGoogleアカウントでログインすると、スマホでもパソコンでも同じライブラリが見えます。"}
      </p>
      <button
        type="button"
        onClick={() => void start()}
        disabled={!ready || busy}
        className="flex h-12 w-full items-center justify-center gap-3 rounded-full bg-yahoo text-base font-bold text-black shadow-sm disabled:opacity-60"
      >
        {busy ? "Googleを開いています" : "Googleで続ける"}
      </button>
      {notice && <p className="text-sm text-red-600">{notice}</p>}
    </div>
  );
}
